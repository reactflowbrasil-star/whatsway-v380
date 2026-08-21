import makeWASocket, {
  Browsers,
  DisconnectReason,
  useMultiFileAuthState,
  type ConnectionState,
  type WASocket,
} from "@whiskeysockets/baileys";
import QRCode from "qrcode";
import path from "node:path";
import fs from "node:fs/promises";
import { storage } from "../storage";

type Session = { socket?: WASocket; status: string; qr?: string; phone?: string };
const sessions = new Map<string, Session>();

const dataDir = () => process.env.TUBECLI_DATA_DIR || process.env.DATA_DIR || "./data";
const sessionDir = (userId: string) => path.join(dataDir(), "whatsapp-sessions", userId);

function emit(userId: string, event: string, payload: unknown) {
  const io = (global as any).io;
  io?.to(`user:${userId}`).emit(event, payload);
}

export async function startBaileysSession(userId: string) {
  const existing = sessions.get(userId);
  if (existing?.status === "connecting" || existing?.status === "connected") return existing;

  await fs.mkdir(sessionDir(userId), { recursive: true });
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir(userId));
  const session: Session = { status: "connecting" };
  sessions.set(userId, session);

  const socket = makeWASocket({ auth: state, browser: Browsers.macOS("WhatsWay"), printQRInTerminal: false });
  session.socket = socket;
  socket.ev.on("creds.update", saveCreds);
  socket.ev.on("connection.update", async (update: Partial<ConnectionState>) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      session.qr = await QRCode.toDataURL(qr, { margin: 2, width: 320 });
      session.status = "qr";
      emit(userId, "whatsapp:qr", { qr: session.qr, status: session.status });
    }
    if (connection === "open") {
      session.status = "connected";
      session.qr = undefined;
      session.phone = socket.user?.id?.split(":")[0];
      const userChannels = (await storage.getChannelsByUser(userId)).data;
      const existingChannel = userChannels.find((channel) => channel.connectionMethod === "qr");
      if (!existingChannel && session.phone) {
        await storage.createChannel({
          name: `WhatsApp ${session.phone}`,
          phoneNumber: session.phone,
          phoneNumberId: session.phone,
          whatsappBusinessAccountId: null,
          appId: null,
          accessToken: "baileys",
          isActive: true,
          connectionMethod: "qr",
          createdBy: userId,
        } as any);
      }
      emit(userId, "whatsapp:status", { status: session.status, phone: session.phone });
    }
    if (connection === "close") {
      const code = (lastDisconnect?.error as any)?.output?.statusCode;
      const shouldReconnect = code !== DisconnectReason.loggedOut;
      session.status = shouldReconnect ? "disconnected" : "logged_out";
      emit(userId, "whatsapp:status", { status: session.status });
      sessions.delete(userId);
      if (shouldReconnect) setTimeout(() => void startBaileysSession(userId), 3000);
    }
  });
  socket.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    for (const message of messages) {
      const remoteJid = message.key.remoteJid;
      const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
      if (!remoteJid || !text || message.key.fromMe) continue;
      const phone = remoteJid.replace(/@s\.whatsapp\.net$/, "");
      const channel = (await storage.getChannelsByUser(userId)).data.find((item) => item.connectionMethod === "qr");
      if (!channel) continue;
      const contact = (await storage.searchContacts(phone)).find((item) => item.phone === phone) || await storage.createContact({ name: phone, phone, email: "", channelId: channel.id, status: "active" });
      let conversation = await storage.getConversationByPhone(phone);
      if (!conversation) conversation = await storage.createConversation({ channelId: channel.id, contactId: contact.id, contactPhone: phone, contactName: contact.name, status: "active", lastMessageAt: new Date(), lastMessageText: text });
      const saved = await storage.createMessage({ conversationId: conversation.id, content: text, direction: "incoming", type: "text", status: "received", whatsappMessageId: message.key.id || null });
      await storage.updateConversation(conversation.id, { lastMessageAt: new Date(), lastMessageText: text });
      (global as any).broadcastToConversation?.(conversation.id, { type: "new_message", message: saved });
    }
  });
  return session;
}

export async function getBaileysSession(userId: string) {
  return sessions.get(userId) || { status: "disconnected" };
}

export async function logoutBaileysSession(userId: string) {
  const session = sessions.get(userId);
  await session?.socket?.logout().catch(() => undefined);
  sessions.delete(userId);
  emit(userId, "whatsapp:status", { status: "logged_out" });
}

export async function sendBaileysText(userId: string, to: string, text: string) {
  const session = sessions.get(userId);
  if (!session?.socket || session.status !== "connected") throw new Error("WhatsApp QR session is not connected");
  const jid = `${to.replace(/\D/g, "")}@s.whatsapp.net`;
  const result = await session.socket.sendMessage(jid, { text });
  return { messages: [{ id: result?.key?.id }] };
}

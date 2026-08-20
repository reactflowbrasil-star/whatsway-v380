import makeWASocket, { DisconnectReason, useMultiFileAuthState } from "@whiskeysockets/baileys";
import QRCode from "qrcode";
import path from "node:path";
import fs from "node:fs/promises";

type Session = {
  socket?: ReturnType<typeof makeWASocket>;
  qr?: string;
  status: "idle" | "connecting" | "qr" | "connected" | "error";
  error?: string;
};

const sessions = new Map<string, Session>();
const authRoot = process.env.WHATSAPP_WEB_AUTH_DIR || path.join(process.cwd(), "data", "whatsapp-web");

export function getWhatsAppWebStatus(channelId: string) {
  const session = sessions.get(channelId);
  return { channelId, status: session?.status || "idle", qr: session?.qr, error: session?.error };
}

export async function connectWhatsAppWeb(channelId: string) {
  const current = sessions.get(channelId);
  if (current?.status === "connecting" || current?.status === "connected") return getWhatsAppWebStatus(channelId);
  const session: Session = { status: "connecting" };
  sessions.set(channelId, session);
  const authPath = path.join(authRoot, channelId);
  await fs.mkdir(authPath, { recursive: true });
  const { state, saveCreds } = await useMultiFileAuthState(authPath);
  const socket = makeWASocket({ auth: state, printQRInTerminal: false, browser: ["WhatsWay", "Chrome", "1.0.0"] });
  session.socket = socket;
  socket.ev.on("creds.update", saveCreds);
  socket.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      session.status = "qr";
      session.qr = await QRCode.toDataURL(qr);
    }
    if (connection === "open") {
      session.status = "connected";
      session.qr = undefined;
      session.error = undefined;
    }
    if (connection === "close") {
      session.socket = undefined;
      const code = (lastDisconnect?.error as any)?.output?.statusCode;
      if (code !== DisconnectReason.loggedOut) {
        session.status = "connecting";
        setTimeout(() => connectWhatsAppWeb(channelId).catch(() => undefined), 3000);
      } else {
        session.status = "idle";
      }
    }
  });
  return getWhatsAppWebStatus(channelId);
}

export async function disconnectWhatsAppWeb(channelId: string) {
  const session = sessions.get(channelId);
  if (session?.socket) session.socket.logout().catch(() => undefined);
  sessions.delete(channelId);
  return getWhatsAppWebStatus(channelId);
}

export async function sendWhatsAppWeb(channelId: string, to: string, text: string) {
  const session = sessions.get(channelId);
  if (!session?.socket || session.status !== "connected") throw new Error("WhatsApp Web channel is not connected");
  const jid = `${to.replace(/\D/g, "")}@s.whatsapp.net`;
  return session.socket.sendMessage(jid, { text });
}

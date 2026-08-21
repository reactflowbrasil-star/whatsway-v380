import type { Express } from "express";
import { requireAuth } from "../middlewares/auth.middleware";
import { getBaileysSession, logoutBaileysSession, startBaileysSession } from "../services/whatsapp-baileys";

export function registerBaileysRoutes(app: Express) {
  app.post("/api/whatsapp/qr/start", requireAuth, async (req, res) => {
    const userId = String((req.session as any).user.id);
    const session = await startBaileysSession(userId);
    res.json({ status: session.status, qr: session.qr, phone: session.phone });
  });
  app.get("/api/whatsapp/qr/status", requireAuth, async (req, res) => {
    const userId = String((req.session as any).user.id);
    const session = await getBaileysSession(userId);
    res.json({ status: session.status, qr: session.qr, phone: session.phone });
  });
  app.post("/api/whatsapp/qr/logout", requireAuth, async (req, res) => {
    await logoutBaileysSession(String((req.session as any).user.id));
    res.json({ success: true });
  });
}

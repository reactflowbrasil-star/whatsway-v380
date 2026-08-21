import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useSocket } from "@/contexts/socket-context";
import { Loader2, RefreshCw } from "lucide-react";

export function BaileysQrConnect() {
  const { socket } = useSocket();
  const [status, setStatus] = useState("disconnected");
  const [qr, setQr] = useState<string>();
  const [phone, setPhone] = useState<string>();

  const start = async () => {
    const response = await apiRequest("POST", "/api/whatsapp/qr/start?reset=true");
    const result = await response.json();
    setStatus(result.status);
    setQr(result.qr);
    setPhone(result.phone);
  };

  useEffect(() => {
    if (!socket) return;
    const onQr = (data: any) => { setQr(data.qr); setStatus(data.status); };
    const onStatus = (data: any) => { setStatus(data.status); setPhone(data.phone); if (data.status === "connected") { setQr(undefined); void queryClient.invalidateQueries({ queryKey: ["/api/channels"] }); } };
    socket.on("whatsapp:qr", onQr);
    socket.on("whatsapp:status", onStatus);
    return () => { socket.off("whatsapp:qr", onQr); socket.off("whatsapp:status", onStatus); };
  }, [socket]);

  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
      <div>
        <h3 className="font-medium">Conectar WhatsApp via QR code</h3>
        <p className="text-sm text-muted-foreground">Abra WhatsApp no celular, acesse Dispositivos conectados e leia o código.</p>
      </div>
      {qr && status === "qr" && <img src={qr} alt="QR code para conectar o WhatsApp" className="mx-auto rounded bg-white p-2" />}
      {status === "connected" && <p className="text-sm text-green-600">Conectado{phone ? `: +${phone}` : ""}.</p>}
      {status !== "connected" && <Button type="button" onClick={() => void start()} disabled={status === "connecting"} className="w-full">
        {status === "connecting" ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Gerando QR code...</> : <><RefreshCw className="mr-2 h-4 w-4" />Gerar QR code</>}
      </Button>}
    </div>
  );
}

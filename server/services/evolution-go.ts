const baseUrl = () => (process.env.EVOLUTION_GO_URL || "https://evolution.reactfly.run.place").replace(/\/$/, "");

function apiKey() {
  const key = process.env.EVOLUTION_GO_API_KEY;
  if (!key) throw new Error("EVOLUTION_GO_API_KEY is not configured");
  return key;
}

export async function sendEvolutionText(instanceToken: string, number: string, text: string) {
  const response = await fetch(`${baseUrl()}/send/text`, {
    method: "POST",
    headers: {
      apikey: instanceToken || apiKey(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ number: number.replace(/\D/g, ""), text }),
  });
  const data: any = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || data?.message || `Evolution GO returned ${response.status}`);
  return { messages: [{ id: data?.data?.Info?.ID || data?.data?.info?.id }] };
}

export async function getEvolutionStatus(instanceToken: string) {
  const response = await fetch(`${baseUrl()}/instance/status`, {
    headers: { apikey: instanceToken || apiKey() },
  });
  const data: any = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || data?.message || `Evolution GO returned ${response.status}`);
  return data;
}

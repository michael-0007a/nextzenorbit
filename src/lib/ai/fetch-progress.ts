import { PROGRESS_HEADER, PROGRESS_TYPE, type AiStage } from "@/lib/ai/progress";

/**
 * fetch() that reports server stages for routes wrapped in withStageStream, then resolves to an
 * ordinary Response with the route's final status and JSON body, so callers keep their existing
 * response.ok / response.json() handling. Non-streaming answers (auth/payment gates) pass through.
 */
export async function fetchWithProgress(url: string, init: RequestInit, onStage: (stage: AiStage) => void): Promise<Response> {
  const response = await fetch(url, { ...init, headers: { ...(init.headers as Record<string, string>), [PROGRESS_HEADER]: "1" } });
  if (!response.body || !response.headers.get("content-type")?.includes(PROGRESS_TYPE)) return response;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines.filter(Boolean)) {
      const message = JSON.parse(line) as { stage?: AiStage; status?: number; body?: unknown };
      if (message.stage) onStage(message.stage);
      if (message.status) return new Response(JSON.stringify(message.body), { status: message.status, headers: { "Content-Type": "application/json" } });
    }
    if (done) return new Response(JSON.stringify({ success: false, error: { message: "The connection closed before the result arrived. Please retry." } }), { status: 502 });
  }
}

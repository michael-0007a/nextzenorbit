import { PROGRESS_HEADER, PROGRESS_TYPE, type AiStage } from "@/lib/ai/progress";

/**
 * Lets a long AI route report stages while it works. When the client sent the progress header,
 * the response is NDJSON: {"stage":...} lines, then {"status":..,"body":..} with the handler's
 * normal response. Without the header the handler runs exactly as before.
 */
export function withStageStream(request: Request, handler: (onStage: (stage: AiStage) => void) => Promise<Response>): Promise<Response> | Response {
  if (request.headers.get(PROGRESS_HEADER) !== "1") return handler(() => {});
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (line: unknown) => { try { controller.enqueue(encoder.encode(JSON.stringify(line) + "\n")); } catch { /* client went away */ } };
      try {
        const response = await handler(stage => send({ stage }));
        send({ status: response.status, body: await response.json().catch(() => null) });
      } catch {
        send({ status: 500, body: { success: false, error: { message: "Something went wrong. Please retry." } } });
      }
      controller.close();
    },
  });
  return new Response(stream, { headers: { "Content-Type": PROGRESS_TYPE, "Cache-Control": "private, no-store", "X-Accel-Buffering": "no" } });
}

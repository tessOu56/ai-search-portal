/**
 * 以最小可行方式解析 text/event-stream（單一 data 行、可選 event 行）。
 */

export type SseMessage = {
  event: string;
  data: string;
};

export async function* readSseMessages(
  body: ReadableStream<Uint8Array> | null,
  signal: AbortSignal
): AsyncGenerator<SseMessage> {
  if (!body) return;
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (!signal.aborted) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let boundary = buffer.indexOf("\n\n");
      while (boundary !== -1) {
        const raw = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        const msg = parseSseBlock(raw);
        if (msg) yield msg;
        boundary = buffer.indexOf("\n\n");
      }
    }
    if (buffer.trim().length > 0) {
      const msg = parseSseBlock(buffer);
      if (msg) yield msg;
    }
  } finally {
    reader.releaseLock();
  }
}

function parseSseBlock(block: string): SseMessage | null {
  const lines = block.split("\n").filter(Boolean);
  let event = "message";
  const dataLines: string[] = [];
  for (const line of lines) {
    if (line.startsWith("event:")) {
      event = line.slice("event:".length).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice("data:".length).trimStart());
    }
  }
  if (dataLines.length === 0) return null;
  return { event, data: dataLines.join("\n") };
}

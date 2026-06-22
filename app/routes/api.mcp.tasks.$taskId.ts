import type { LoaderFunctionArgs } from "@remix-run/node";
import { eventStream } from "remix-utils/sse/server";

import { getMcpTask } from "~/services/mcp-gateway.server";
import { mcpTaskEventSchema } from "~/shared/contracts";

export function loader({ params, request }: LoaderFunctionArgs) {
  const taskId = params.taskId;
  if (!taskId) {
    throw new Response("Missing taskId", { status: 400 });
  }

  return eventStream(request.signal, (send) => {
    let ticks = 0;
    const interval = setInterval(() => {
      ticks += 1;
      const task = getMcpTask(taskId);
      if (!task) {
        const payload = mcpTaskEventSchema.parse({
          taskId,
          status: "failed",
          progress: 0,
        });
        send({ event: "task", data: JSON.stringify(payload) });
        clearInterval(interval);
        send({ event: "done", data: "done" });
        return;
      }

      const payload = mcpTaskEventSchema.parse({
        taskId: task.taskId,
        status: task.status,
        progress: task.progress,
        result: task.status === "completed" ? task.result : undefined,
      });
      send({ event: "task", data: JSON.stringify(payload) });

      if (task.status === "completed" || task.status === "failed") {
        clearInterval(interval);
        send({ event: "done", data: "done" });
      }

      if (ticks > 50) {
        clearInterval(interval);
        send({ event: "done", data: "done" });
      }
    }, 200);

    return () => clearInterval(interval);
  });
}

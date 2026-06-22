import { json } from "@remix-run/node";

import { listContextPacks } from "~/services/context-pack.server";
import { listContextPacksResponseSchema } from "~/shared/contracts";

export function loader() {
  const body = listContextPacksResponseSchema.parse({
    data: listContextPacks(),
  });
  return json(body);
}

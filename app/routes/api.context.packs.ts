import {
  listContextPacks,
  resolveContentRoot,
} from "~/services/context-pack.server";
import { listContextPacksResponseSchema } from "~/shared/contracts";

export function loader() {
  const body = listContextPacksResponseSchema.parse({
    data: listContextPacks(resolveContentRoot()),
  });
  return Response.json(body);
}

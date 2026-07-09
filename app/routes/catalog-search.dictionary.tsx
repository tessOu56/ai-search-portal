import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { getDictionaryModel } from "~/features/catalogsearch/dictionary.server";
import { DictionaryPanel } from "~/features/catalogsearch/DictionaryPanel";

/**
 * T-2026-017 — virtualized catalog dictionary (10k mock rows).
 * Lives under the /catalog-search layout; the paginated _index route and its
 * URL contract (?q= ?type= ?page=) are untouched (no-regression acceptance).
 */
export function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const type = url.searchParams.get("type") ?? undefined;
  const virtual = url.searchParams.get("virtual") !== "off";
  return {
    model: getDictionaryModel(query, { type, virtual }),
  };
}

export const meta: MetaFunction = () => [
  { title: "Catalog dictionary — virtualized 10k rows" },
  {
    name: "description",
    content:
      "Virtual scrolling demo over a 10k-row mock dictionary with URL-driven filters.",
  },
];

export default function CatalogDictionaryPage() {
  const { model } = useLoaderData<typeof loader>();
  return <DictionaryPanel model={model} />;
}

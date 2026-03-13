/**
 * 供 useFetcher().submit(data, options) 使用的 payload 型別。
 * Remix 會將物件序列化為 FormData；僅能傳遞可序列化資料（無 function、Symbol）。
 * 各 feature 的 Create/Update input 應與此相容（primitive 或 plain object/array）。
 */

export type FetcherSubmitData = Record<string, unknown>;

export type SubmitOptions = {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  action: string;
};

type FetcherLike = {
  submit(data: unknown, options?: SubmitOptions): void;
};

/**
 * 以物件 payload 呼叫 fetcher.submit。Remix 型別要求 SubmitTarget，實務上可序列化物件可用；
 * 此 helper 集中型別斷言於一處，避免各 hook 使用 as any 或觸發 no-unsafe-argument。
 */
export function submitFormPayload(
  fetcher: FetcherLike,
  data: FetcherSubmitData,
  options: SubmitOptions
): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Remix SubmitTarget; object payload valid at runtime
  fetcher.submit(data as any, options);
}

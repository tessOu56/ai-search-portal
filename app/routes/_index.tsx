import type { MetaFunction, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useActionData, useNavigation, Form } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { title: "AI 搜尋入口" },
    { name: "description", content: "智能 AI 搜尋平台" },
  ];
};

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const query = formData.get("query") as string;

  if (!query || query.trim().length === 0) {
    return json({ error: "請輸入搜尋關鍵字" }, { status: 400 });
  }

  // 模擬 AI 搜尋 API 呼叫
  // 在實際應用中，這裡會呼叫真實的 AI API (如 OpenAI, Anthropic 等)
  try {
    // 模擬延遲
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 模擬搜尋結果
    const results = [
      {
        title: `關於「${query}」的搜尋結果 1`,
        snippet: `這是關於「${query}」的詳細資訊。AI 搜尋引擎已經為您找到了相關內容。`,
        url: "#",
      },
      {
        title: `「${query}」相關資訊`,
        snippet: `更多關於「${query}」的內容和資源。這些結果經過 AI 智能分析。`,
        url: "#",
      },
      {
        title: `${query} - 深入解析`,
        snippet: `深入瞭解「${query}」的各個面向。AI 已為您整理最相關的資訊。`,
        url: "#",
      },
    ];

    return json({ results, query });
  } catch (error) {
    return json(
      { error: "搜尋時發生錯誤，請稍後再試" },
      { status: 500 }
    );
  }
}

export default function Index() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSearching = navigation.state === "submitting";

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-primary-700 mb-4">
            AI 搜尋入口
          </h1>
          <p className="text-xl text-gray-600">
            智能搜尋，快速找到您需要的資訊
          </p>
        </div>

        {/* Search Form */}
        <div className="max-w-3xl mx-auto mb-12">
          <Form method="post" className="space-y-4">
            <div className="relative">
              <input
                type="text"
                name="query"
                placeholder="輸入您的搜尋關鍵字..."
                className="w-full px-6 py-4 text-lg border-2 border-primary-200 rounded-full focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all shadow-lg"
                required
                disabled={isSearching}
              />
              <button
                type="submit"
                disabled={isSearching}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-8 py-3 bg-primary-600 text-white rounded-full hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-md"
              >
                {isSearching ? "搜尋中..." : "搜尋"}
              </button>
            </div>
          </Form>
        </div>

        {/* Error Message */}
        {actionData?.error && (
          <div className="max-w-3xl mx-auto mb-8">
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
              {actionData.error}
            </div>
          </div>
        )}

        {/* Search Results */}
        {actionData?.results && (
          <div className="max-w-3xl mx-auto">
            <div className="mb-6">
              <p className="text-gray-600">
                找到 <span className="font-semibold text-primary-700">{actionData.results.length}</span> 筆關於「
                <span className="font-semibold">{actionData.query}</span>」的結果
              </p>
            </div>
            <div className="space-y-4">
              {actionData.results.map((result, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-100"
                >
                  <h3 className="text-xl font-semibold text-primary-700 mb-2">
                    {result.title}
                  </h3>
                  <p className="text-gray-600 mb-4">{result.snippet}</p>
                  <a
                    href={result.url}
                    className="text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-2"
                  >
                    查看詳情
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!actionData && !isSearching && (
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-lg shadow-md p-12 border border-gray-100">
              <svg
                className="w-24 h-24 mx-auto text-primary-300 mb-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                開始您的搜尋
              </h2>
              <p className="text-gray-500">
                在上方輸入關鍵字，讓 AI 為您找到最相關的資訊
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-16 py-8 border-t border-gray-200">
        <div className="container mx-auto px-4 text-center text-gray-500">
          <p>© 2024 AI 搜尋入口 - Powered by Remix</p>
        </div>
      </footer>
    </div>
  );
}


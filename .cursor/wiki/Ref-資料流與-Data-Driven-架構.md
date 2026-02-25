# Ref-資料流與 Data-Driven 架構

本文件描述「資料測試導向」下的請求與契約流動方式。

---

## 資料流（請求方向）

```
┌─────────────────────────────────────────────────────────────────────────┐
│  UI（Component / Page）                                                  │
│  僅允許：useFetcher( path ) 或 shared api client( path )                 │
│  禁止：直接 fetch( 任意 URL )                                            │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │ path 必須在契約／對照表內
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Contract（app/shared/contracts/）                                       │
│  Zod schema：request / response 定義；單一來源、可 runtime 驗證         │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
         ┌───────────────────────┴───────────────────────┐
         ▼                                                 ▼
┌─────────────────────┐                         ┌─────────────────────────┐
│  Test 環境          │                         │  Production / Dev       │
│  MSW 攔截 fetch     │                         │  Remix route handler    │
│  handler 回傳前     │                         │  回傳前（建議）         │
│  schema.parse(body) │                         │  schema.parse(body)     │
└─────────────────────┘                         └─────────────────────────┘
```

---

## 角色對應

| 角色           | 職責                                    |
| -------------- | --------------------------------------- |
| **Spec**       | 業務範圍、資料流、驗收；RA- / ticket    |
| **Contract**   | Zod schema；request/response 可驗證     |
| **Mock (MSW)** | Handler 產出經 schema parse；可執行規格 |
| **Test**       | 依 handler 與 fixture；可先於 UI        |
| **UI**         | 只打契約路徑；不直接 fetch 硬編碼       |

---

## 相關

- **SOP-資料測試導向開發-制度**：完整流程與強制規則
- **Ref-Contract-與-Schema-規範**：Zod 使用與 template
- **Ref-API-與-Handler-對照**：path 與 handler 對應

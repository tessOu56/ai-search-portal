# Specs 目錄（治理與契約）

**類型**：entry | **權重**：1

本目錄與 **`docs/product/`**、**`docs/architecture/`** 搭配，描述「規格如何驅動實作」。程式契約（Zod／generated）的**落地位置**見 [`packages/shared-contracts/`](../packages/shared-contracts/)。

---

## 現在誰是 SoT（階段一～二過渡期）

| 層級                               | 權威                                                                                                                                  |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **程式層（runtime schema／型別）** | **`@ai-search-portal/contracts`**（`packages/shared-contracts`，Zod）為 **SoT**。                                                     |
| **OpenAPI（`specs/openapi/`）**    | **必須與 Zod 對齊**；在宣告切換前 **不作為唯一強制來源**。變更順序：**先改 Zod，再同步 OpenAPI**（並跑 `pnpm run codegen:openapi`）。 |

禁止：只改 OpenAPI 或只改 Zod、兩邊各自為政。

### 切換時點（階段二穩定後，以 ADR 宣告）

- **HTTP 契約 SoT** → `specs/openapi/*`
- **`packages/shared-contracts`** → **僅含 generated**（手寫 Zod退場或僅過渡層）

詳見 [docs/adr/spec-driven-contracts-and-sot.md](../docs/adr/spec-driven-contracts-and-sot.md)。

---

## 目錄約定

| 路徑                       | 用途                                                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **`specs/api/`**           | 契約撰寫約定、handler 對照（[contract-schema.md](api/contract-schema.md)、[handler-mapping.md](api/handler-mapping.md)） |
| **`specs/openapi/`**       | HTTP 契約（YAML）；Spectral lint + codegen 來源                                                                          |
| **`specs/datacontracts/`** | 資料集治理契約（欄位、PII、owner、terms）                                                                                |
| **`specs/policies/`**      | OPA Rego 政策（`opa test`）                                                                                              |
| **`specs/domain/`**        | 領域流程 spec（如 metadata 申請狀態機）                                                                                  |
| **`specs/schemas/`**       | 索引與入口說明                                                                                                           |

---

## Generated 政策

- **`packages/shared-contracts/src/generated/`** 內檔案**僅能**由 `pnpm run codegen:openapi` 產生與更新。
- **禁止**手修 generated 作為正式解法；緊急修正須回補 OpenAPI／Zod 與腳本後再產出。

---

## 相關指令

- OpenAPI lint：`pnpm run lint:openapi`
- 產生型別：`pnpm run codegen:openapi`
- 契約套件建置：`pnpm run build:contracts`

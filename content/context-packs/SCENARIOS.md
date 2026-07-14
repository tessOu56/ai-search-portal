# Context Pack 情境資料設計（Scenario Playbook）

每一種前端回應情境都有對應的實際資料可以觸發。切換 pack：`?pack=<id>`、cookie `context_pack`、或 env `CONTEXT_PACK`（優先序由左至右，見 context-pack-loader）。

## Pack 一覽

| Pack                     | 角色                                                                 | Assets | 分頁（PAGE_SIZE=5）   |
| ------------------------ | -------------------------------------------------------------------- | ------ | --------------------- |
| `enterprise-mau`         | 原示範（英文，預設）                                                 | 8      | 2 頁                  |
| `agri-supply`            | **農領域**：產地→食譜（money/time/region facets）                    | 12     | 3 頁                  |
| `metalcraft-studio`      | **金工領域**：原料→產品→體驗服務（對齊 metalcraft-platform seed id） | 12     | 3 頁                  |
| `scenario-lab`           | 極端／邊界情境專用                                                   | 11     | 3 頁（末頁 1 筆）     |
| `scenario-broken-assets` | ⚠️ 故意壞掉：測 5xx 錯誤路徑                                         | —      | 選取即拋 schema error |

## 情境 → 觸發資料 → 預期前端行為

### 正常但豐富（領域 pack 內嵌）

| 情境         | 觸發資料                                                                                                                                            | 預期行為                                                               |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 金額展示     | `facets.pricing`（agri: `tbl-procurement-lot` 182.5 TWD/kg；metalcraft: `tbl-material-cost` 32.5 TWD/g、`tbl-experience-session` 2800 TWD/session） | 新 optional 欄位，現有 UI 忽略；接上後顯示幣值＋計價單位               |
| 時間窗／季節 | `facets.timeWindow`（agri: `tbl-harvest-lot` seasonal:JUL-SEP；metalcraft: `tbl-experience-session` weekly:SAT、`tbl-auction-bid` 拍賣窗口）        | 可用性／檔期展示                                                       |
| 地區         | `facets.region`（TW-NORTH／TW-YUN／TW-TPE／TW-NTP）                                                                                                 | 地區篩選與標示；兩領域共用同一 code 空間                               |
| 指標最新值   | `metrics[].latestValue` + `valueType`（money/duration/ratio）                                                                                       | 指標卡顯示數值＋單位＋asOf＋地區                                       |
| 跨 repo 綁定 | metalcraft `bindings.json` entityId = metalcraft-platform seed（`prod-mat-1`、`studio-1`…）                                                         | bindings API 回列（現階段 `resolved:false`，G4 resolver 接通後真值化） |

### 資料缺失／不齊但合理

| 情境                   | 觸發資料                                                                                               | 預期行為                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| 欄位描述缺失           | `dim-ingredient.origin_region`（無 description）                                                       | 欄位表顯示「—」                                              |
| 無 columns、無 metrics | agri `tbl-market-price-legacy`、metalcraft `tbl-rental-slot`（`facets.completeness: minimal/partial`） | 詳情頁空欄位表；completeness 欄位讓「不齊」成為明示狀態      |
| 無血緣                 | `tbl-consumer-preference`、`asset-minimal`（upstream/downstream 皆空）                                 | lineage 區顯示「—」／「No lineage edges.」                   |
| 過期資料               | `asset-stale`（updatedAt 2019）、`tbl-market-price-legacy`（2023）                                     | 依 updatedAt 排序沉底；可做 freshness 提示                   |
| 空描述                 | `asset-empty-description`（description=""）                                                            | 列表顯示空白（契約允許空字串；如需 fallback 文案是前端待辦） |
| 極簡合法資料           | `asset-minimal`                                                                                        | 全空狀態渲染不崩潰                                           |

### 權限／治理（政策引擎矩陣）

| 情境         | 觸發資料＋條件                                                                                                       | 預期行為                                                                           |
| ------------ | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| HITL 審批    | PII 資產（agri `tbl-consumer-preference`、metalcraft `tbl-customer-profile`、lab `asset-all-masked`）＋ role=analyst | `need_approval=true` → 詳情頁「Human confirmation required (HITL)」；submit 回 422 |
| 行銷用途加審 | 任一 PII ＋ purpose=marketing                                                                                        | 追加 reason「marketing purpose on PII requires approval」                          |
| 欄位遮罩     | `sensitive:true` 欄（unit_price、email、phone、line_uid…）；`asset-all-masked` 全欄位                                | 欄名 ••••••＋「Masked by policy」；全遮罩表整表遮蔽                                |
| 稽核標記     | confidential 資產（`tbl-procurement-lot`、`dash-studio-margin`、`asset-confidential-audit`）                         | `require_audit=true` → audit badge＋reason                                         |
| Default deny | `asset-default-deny`（internal）＋ role=analyst                                                                      | 按鈕 disabled，reason「policy: default deny」                                      |
| 直接允許     | 同資產 role=engineer（internal）或 data_admin（任意）                                                                | `allow=true` 直接通過                                                              |

### 錯誤／邊界

| 情境          | 觸發資料                                                                                            | 預期行為                                                        |
| ------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Lineage 循環  | `asset-cycle-a` ⇄ `asset-cycle-b`                                                                   | Kahn 拓撲排序失敗 → `cycleError` banner，dependencyOrder 不顯示 |
| 5xx／載入失敗 | 選取 `scenario-broken-assets` pack（assetType 非法）                                                | loader parse throw → API 5xx → 前端錯誤邊界／AiFallbackPanel    |
| 404           | `GET /api/context/metrics/metric-nonexistent`；lab `metric-dangling-source` 的 sourceAssetId 不存在 | 「Metric not found」；dangling ref 需優雅降級                   |
| 搜尋無結果    | 任一 pack 搜 `zzz_no_match`                                                                         | 「No assets match.」                                            |
| 分頁邊界      | scenario-lab 共 11 筆 = 3 頁（末頁 1 筆）；兩領域 pack 各 12 筆                                     | Previous/Next 邊界行為、末頁短列                                |
| 版面溢出      | `asset-overflow`（超長名稱／描述／14 個 tags）                                                      | 截斷、換行不破版                                                |
| Unicode       | `asset-unicode`（CJK＋emoji＋RTL＋全形）                                                            | 搜尋 highlight 與排版不壞                                       |
| 未來時間窗    | `asset-future-window`（2027 檔期）                                                                  | 「即將開放」而非「進行中」                                      |
| Metric 空清單 | `metric-empty-everything`                                                                           | jobs/dashboards/rules/changes 全空狀態                          |
| Binding 懸空  | lab bindings（entityId/contextRef 均不存在）                                                        | `resolved:false` 照常回傳，不崩潰                               |

## 規格變更（本次新增，皆為非破壞性 optional）

- `packages/shared-contracts/src/domain-facets.contract.ts`：`monetaryAmountSchema`（ISO 4217＋計價基準）、`regionRefSchema`（code/label/level）、`timeWindowSchema`（ISO 8601＋recurrence）、`dataCompletenessSchema`、`domainFacetsSchema`、`metricValueSchema`、`metricValueTypeSchema`
- `metadataAssetSummarySchema` ＋ `facets?`；`metadataColumnSchema` ＋ `unit?`
- `contextMetricSchema` ＋ `valueType?`／`latestValue?`
- `specs/openapi/openapi.yaml` 同步新增 `DomainFacets`／`MonetaryAmount`／`RegionRef`／`TimeWindow`／`MetricValue`

改動後請執行：`pnpm codegen:openapi && pnpm build:contracts && pnpm verify:openapi-codegen && pnpm lint:openapi`。

## 已驗證（2026-07-14 沙盒實測）

所有 pack 通過更新後 zod 契約 parse（含兩領域 pack 的血緣／metric 參照完整性檢查）；backend 實測：pack 發現 5 個、`metalcraft-studio` 分頁 12 筆→3 頁、broken pack 回 500、default-deny／marketing+PII 雙審批／全欄位遮罩／confidential+data_admin（allow+audit+遮罩）／submit 422 全部符合預期。

注意：`backend/` 的 access-request `evaluate`／`submit` 原本不讀 `?pack=`（只能評估預設 pack），本次已修正為與其他 metadata 路由及 Remix BFF 一致——測政策情境時記得帶 `?pack=<id>`。

## 注意事項

- loader 有 module-level cache：改 pack 內容後需重啟 dev server（或呼叫 `resetContextPackCache()`）。
- `scenario-broken-assets` 是**故意壞的**，勿修；它驗證的就是壞資料的錯誤路徑。
- 兩個領域 pack 的地區 code 共用 `TW-*` 空間，跨農／金工的地區彙總查詢因此可行。

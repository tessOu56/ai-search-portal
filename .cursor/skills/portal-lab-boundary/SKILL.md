---
name: portal-lab-boundary
description: >-
  Use in ai-search-portal when adding or changing labs/*, WebGPU, WebCodecs,
  WASM, in-browser LLM, or promoting lab code into app/. Keeps v1 contract safe.
---

# Portal lab boundary

## When to use

- 新建或修改 `labs/*`
- WebCodecs、WebGPU、WASM、本機 LLM POC
- 討論「能不能把 lab 合進主站」

## Rules

1. **Default location**: `labs/<name>/` with own README + package.json if needed.
2. **No breaking changes** to `packages/shared-contracts` chat SSE from lab-only work.
3. **No direct imports** from `app/routes` into experimental GPU/LLM deps until promote review.
4. **Register** new lab in [labs/README.md](../../labs/README.md).

## Promote checklist (lab → app)

- [ ] Phase 4+ 有明確產品需求（GAP 或 ADR）
- [ ] Bundle / 效能評估一節
- [ ] pr-gate + test:labs green
- [ ] 契約變更走 `portal-contract-change`

## on-device-media (ODM) sub-phases

| Sub   | Scope                          |
| ----- | ------------------------------ |
| ODM-1 | WebCodecs Worker demo          |
| ODM-2 | WebGPU WGSL pass               |
| ODM-3 | WASM / memory notes (optional) |
| ODM-4 | RAG stub eval case (optional)  |

## Forbidden

- WebGPU / WebLLM in `app/features` without promote checklist
- Duplicate the internal reference catalog UX in lab as production SSOT

## References

- [labs/README.md](../../labs/README.md)

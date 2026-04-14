/**
 * 與 app/services/mock-items.server.ts 對齊的記憶體 store（開發／示範用）。
 */

export type MockItem = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

let items: MockItem[] = [
  {
    id: "1",
    name: "Mock item alpha",
    description: "First seeded mock item",
    createdAt: "2026-02-03T00:00:00.000Z",
    updatedAt: "2026-02-03T00:00:00.000Z",
  },
  {
    id: "2",
    name: "Mock item beta",
    description: "Second seeded mock item",
    createdAt: "2026-02-03T00:05:00.000Z",
    updatedAt: "2026-02-03T00:05:00.000Z",
  },
];
let nextId = 3;

const nowIso = () => new Date().toISOString();

export function listMockItems() {
  return [...items];
}

export function getMockItem(id: string) {
  return items.find((item) => item.id === id) ?? null;
}

export function createMockItem(input: {
  name: string;
  description: string | null;
}) {
  const timestamp = nowIso();
  const item: MockItem = {
    id: String(nextId),
    name: input.name,
    description: input.description,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  nextId += 1;
  items = [item, ...items];
  return item;
}

export function updateMockItem(
  id: string,
  input: { name?: string; description?: string | null }
) {
  const existing = items.find((item) => item.id === id);
  if (!existing) {
    return null;
  }
  const updated: MockItem = {
    ...existing,
    name: input.name ?? existing.name,
    description:
      input.description === undefined
        ? existing.description
        : input.description,
    updatedAt: nowIso(),
  };
  items = items.map((item) => (item.id === id ? updated : item));
  return updated;
}

export function deleteMockItem(id: string) {
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) {
    return null;
  }
  const [removed] = items.splice(index, 1);
  return removed;
}

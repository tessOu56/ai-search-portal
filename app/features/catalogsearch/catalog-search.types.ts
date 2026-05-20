/** Placeholder types — align with able_portal catalog-search when porting. */

export type CatalogSearchFilter = {
  id: string;
  label: string;
  options: { value: string; label: string }[];
};

export type CatalogApiRow = {
  id: string;
  name: string;
  description: string;
  itemType: string;
};

export type CatalogSearchViewModel = {
  phase: "placeholder";
  query: string;
  filters: CatalogSearchFilter[];
  results: CatalogApiRow[];
  /** Active filter from query string (mock). */
  activeType?: string;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

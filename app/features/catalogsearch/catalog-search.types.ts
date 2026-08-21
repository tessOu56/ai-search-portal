/** Placeholder types — align with the internal reference catalog when porting. */

export type CatalogSearchFilter = {
  id: string;
  label: string;
  options: { value: string; label: string }[];
};

export type CatalogSearchPhase = "placeholder" | "hybrid";

export type CatalogResultSource = "catalog" | "metadata" | "knowledge";

export type CatalogRowFacets = {
  materials: string[];
  techniques: string[];
  standards: string[];
  productTypes?: string[];
  auctionEligible?: boolean;
  classification?: string;
};

export type CatalogApiRow = {
  id: string;
  name: string;
  description: string;
  itemType: string;
  source: CatalogResultSource;
  /** Present for metadata-backed / knowledge rows — deep link. */
  detailHref?: string;
  /** Industry facets — mainly on knowledge rows. */
  facets?: CatalogRowFacets;
  owner?: string;
  classification?: string;
  updatedAt?: string;
};

export type CatalogSearchIntent = "ai-fallback" | "manual";

export type CatalogSearchViewModel = {
  phase: CatalogSearchPhase;
  query: string;
  /** How the user arrived — preserved for UX continuity from AI fallback. */
  intent?: CatalogSearchIntent;
  filters: CatalogSearchFilter[];
  results: CatalogApiRow[];
  /** Active filter from query string (mock). */
  activeType?: string;
  /** Industry facet filters (knowledge corpus). */
  activeMaterial?: string;
  activeStandard?: string;
  activeProductType?: string;
  activeAuctionEligible?: boolean;
  /** When URL facet values were invalid and cleared. */
  facetWarning?: string;
  /** Available industry facet values from current knowledge slice. */
  industryFacets?: {
    materials: string[];
    standards: string[];
    productTypes: string[];
    auctionEligible: boolean;
  };
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  /** Breakdown when phase is hybrid. */
  sourceCounts?: {
    metadata: number;
    catalog: number;
    knowledge: number;
  };
};

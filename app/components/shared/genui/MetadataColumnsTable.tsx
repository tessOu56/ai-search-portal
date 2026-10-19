import { Badge } from "~/components/ui/Badge";
import type { MetadataColumnContract } from "~/shared/contracts";

export type MetadataColumnsTableProps = {
  columns: MetadataColumnContract[];
  maskFields?: string[];
};

export function MetadataColumnsTable({
  columns,
  maskFields = [],
}: MetadataColumnsTableProps) {
  const maskSet = new Set(maskFields);

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="bg-muted px-space-16 py-space-8 text-type-12 font-medium text-muted-foreground">
        Columns
      </div>
      <div className="divide-y divide-border text-sm">
        {columns.map((col) => {
          const masked = maskSet.has(col.name);
          return (
            <div
              key={col.name}
              className="grid grid-cols-1 gap-space-4 px-space-16 py-space-8 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)_auto] sm:gap-space-8"
            >
              <span className="font-medium">
                {masked ? "••••••" : col.name}
              </span>
              <span className="text-muted-foreground">{col.dataType}</span>
              <span className="text-muted-foreground">
                {masked ? "Masked by policy" : (col.description ?? "—")}
              </span>
              <div className="flex flex-wrap justify-end gap-1">
                {col.sensitive ? (
                  <Badge variant="outline" className="text-type-12">
                    sensitive
                  </Badge>
                ) : null}
                {masked ? (
                  <Badge variant="secondary" className="text-type-12">
                    masked
                  </Badge>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

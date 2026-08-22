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
      <div className="bg-muted px-4 py-2 text-xs font-medium text-muted-foreground">
        Columns
      </div>
      <div className="divide-y divide-border text-sm">
        {columns.map((col) => {
          const masked = maskSet.has(col.name);
          return (
            <div
              key={col.name}
              className="grid grid-cols-[1fr_1fr_2fr_auto] gap-space-8 px-space-16 py-space-8"
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
                  <Badge variant="outline" className="text-xs">
                    sensitive
                  </Badge>
                ) : null}
                {masked ? (
                  <Badge variant="secondary" className="text-xs">
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

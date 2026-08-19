import { Badge } from "~/components/ui/Badge";
import { Panel } from "~/components/ui/Panel";

export type MetadataSummaryCardProps = {
  name: string;
  fqn: string;
  owner: string;
  classification: string;
  tags: string[];
};

export function MetadataSummaryCard({
  name,
  fqn,
  owner,
  classification,
  tags,
}: MetadataSummaryCardProps) {
  return (
    <Panel>
      <h2 className="text-type-16 font-semibold text-foreground">{name}</h2>
      <div className="mt-3 space-y-2 text-sm text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">FQN:</span> {fqn}
        </p>
        <p>
          <span className="font-medium text-foreground">Owner:</span> {owner}
        </p>
        <p>
          <span className="font-medium text-foreground">Classification:</span>{" "}
          <Badge variant="outline">{classification}</Badge>
        </p>
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </Panel>
  );
}

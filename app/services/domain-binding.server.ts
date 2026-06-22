/**
 * Resolves context pack domain bindings against food domain modules.
 */

import { getDish } from "~/features/dish/dish.server";
import { getIngredient } from "~/features/ingredient/ingredient.server";
import { getVendor } from "~/features/vendor/vendor.server";
import type { DomainBindingContract } from "~/shared/contracts";
import {
  loadPackBindings,
  resolveContentRoot,
  resolveDomainBindings,
} from "~/shared/services/context-pack-loader.server";

export type ResolvedDomainBinding = DomainBindingContract & {
  resolved: boolean;
  entityName?: string;
};

function resolveEntityName(binding: DomainBindingContract): {
  resolved: boolean;
  entityName?: string;
} {
  const { module, entityId } = binding;
  if (module === "ingredient") {
    const row = getIngredient(entityId);
    return row ? { resolved: true, entityName: row.name } : { resolved: false };
  }
  if (module === "vendor") {
    const row = getVendor(entityId);
    return row ? { resolved: true, entityName: row.name } : { resolved: false };
  }
  if (module === "dish") {
    const row = getDish(entityId);
    return row ? { resolved: true, entityName: row.name } : { resolved: false };
  }
  return { resolved: false };
}

export function resolveBindingsForPack(
  packId: string,
  contextRef?: string
): ResolvedDomainBinding[] {
  const bindings = resolveDomainBindings(
    packId,
    contextRef,
    resolveContentRoot()
  );
  return bindings.map((binding) => {
    const entity = resolveEntityName(binding);
    return {
      ...binding,
      resolved: entity.resolved,
      entityName: entity.entityName,
    };
  });
}

export function hasPackBindings(packId: string): boolean {
  return loadPackBindings(packId, resolveContentRoot()).length > 0;
}

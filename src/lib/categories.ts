import type { Category } from "@/types/db";

export interface CategoryNode extends Category {
  children: CategoryNode[];
}

/** Nests a flat category list into a tree using parent_id. */
export function buildCategoryTree(categories: Category[]): CategoryNode[] {
  const byId = new Map<string, CategoryNode>();
  categories.forEach((c) => byId.set(c.id, { ...c, children: [] }));
  const roots: CategoryNode[] = [];
  byId.forEach((node) => {
    const parent = node.parent_id ? byId.get(node.parent_id) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  });
  return roots;
}

export function topLevelCategories(categories: Category[]): Category[] {
  return categories.filter((c) => !c.parent_id);
}

/** Depth-first, parent-before-children order — for indented <select> option lists. */
export function flattenWithDepth(
  nodes: CategoryNode[],
  depth = 0,
): Array<{ node: CategoryNode; depth: number }> {
  return nodes.flatMap((node) => [
    { node, depth },
    ...flattenWithDepth(node.children, depth + 1),
  ]);
}

/** All descendant ids of a category — used to keep a category out of its own parent picker. */
export function descendantIds(categories: Category[], id: string): Set<string> {
  const childrenOf = new Map<string, string[]>();
  categories.forEach((c) => {
    if (c.parent_id) childrenOf.set(c.parent_id, [...(childrenOf.get(c.parent_id) ?? []), c.id]);
  });
  const result = new Set<string>();
  const stack = [...(childrenOf.get(id) ?? [])];
  while (stack.length > 0) {
    const next = stack.pop()!;
    if (result.has(next)) continue;
    result.add(next);
    stack.push(...(childrenOf.get(next) ?? []));
  }
  return result;
}

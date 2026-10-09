import type { DataProvider } from "ra-core";

import type { Tag } from "../types";
import { colors } from "./colors";

export const normalizeTagName = (name: string) => name.trim().toLowerCase();
export const normalizeTagColor = (color: string) => color.trim().toLowerCase();

export const getUniqueTags = (tags: Tag[]) => {
  const uniqueTags: Tag[] = [];
  const names = new Set<string>();
  const tagColors = new Set<string>();

  for (const tag of [...tags].sort((a, b) => a.id - b.id)) {
    const name = normalizeTagName(tag.name);
    const color = normalizeTagColor(tag.color);
    if (names.has(name) || tagColors.has(color)) continue;
    names.add(name);
    tagColors.add(color);
    uniqueTags.push(tag);
  }

  return uniqueTags;
};

export const findTagConflict = (
  tags: Tag[],
  candidate: Pick<Tag, "name" | "color">,
  excludingId?: Tag["id"],
) =>
  tags.find(
    (tag) =>
      tag.id !== excludingId &&
      normalizeTagName(tag.name) === normalizeTagName(candidate.name),
  ) ??
  tags.find(
    (tag) =>
      tag.id !== excludingId &&
      normalizeTagColor(tag.color) === normalizeTagColor(candidate.color),
  );

export async function resolveTagsWithCache(
  names: string[],
  cache: Map<string, Tag>,
  dataProvider: DataProvider,
) {
  const trimmedNames = [
    ...new Set(names.map((name) => name.trim()).filter(Boolean)),
  ];
  const uncachedNames = trimmedNames.filter(
    (name) => !cache.has(normalizeTagName(name)),
  );
  const usedColors = new Set<string>();

  if (uncachedNames.length > 0) {
    const response = await dataProvider.getList<Tag>("tags", {
      pagination: { page: 1, perPage: 1000 },
      sort: { field: "id", order: "ASC" },
    });
    for (const tag of response.data) {
      const key = normalizeTagName(tag.name);
      if (!cache.has(key)) cache.set(key, tag);
      usedColors.add(normalizeTagColor(tag.color));
    }
    for (const tag of cache.values()) {
      usedColors.add(normalizeTagColor(tag.color));
    }
  }

  for (const name of trimmedNames) {
    const key = normalizeTagName(name);
    if (cache.has(key)) continue;

    const color = colors.find(
      (candidate) => !usedColors.has(normalizeTagColor(candidate)),
    );
    if (!color) {
      throw new Error(
        `Cannot import tag "${name}": all ${colors.length} tag colors are already in use.`,
      );
    }

    const result = await dataProvider.create<Tag>("tags", {
      data: { name, color },
    });
    cache.set(key, result.data);
    usedColors.add(normalizeTagColor(color));
  }

  return new Map(
    trimmedNames.map((name) => [name, cache.get(normalizeTagName(name))!]),
  );
}

import { describe, expect, it } from "vitest";

import type { Tag } from "../types";
import { findTagConflict, getUniqueTags } from "./tagUtils";

const tags: Tag[] = [
  { id: 4, name: "important", color: "#99c1de" },
  { id: 5, name: " IMPORTANT ", color: "#99C1DE" },
  { id: 6, name: "customer", color: "#99c1de" },
  { id: 7, name: "prospect", color: "#fff1e6" },
];

describe("tag uniqueness", () => {
  it("keeps the oldest tag when names or colors are duplicated", () => {
    expect(getUniqueTags(tags).map(({ id }) => id)).toEqual([4, 7]);
  });

  it("finds duplicate names without regard to case or whitespace", () => {
    expect(
      findTagConflict(tags, { name: " Important ", color: "#eddcd2" })?.id,
    ).toBe(4);
  });

  it("finds duplicate colors without regard to case", () => {
    expect(findTagConflict(tags, { name: "new", color: "#99C1DE" })?.id).toBe(
      4,
    );
  });

  it("allows the current name and color while editing", () => {
    expect(
      findTagConflict(
        getUniqueTags(tags),
        { name: "important", color: "#99c1de" },
        4,
      )?.id,
    ).toBeUndefined();
  });
});

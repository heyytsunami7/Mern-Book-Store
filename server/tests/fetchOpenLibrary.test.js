import { describe, it, expect, vi } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { fetchOpenLibraryCatalog, parseFetchArgs } = require("../scripts/lib/fetchOpenLibrary");
const { OPENLIBRARY_QUERIES } = require("../scripts/lib/categories");
const { CATEGORIES } = require("../src/constants");

const makeBook = (id) => ({
  externalId: `/works/OL${id}W`,
  title: `Book ${id}`,
  authors: ["A. Writer"],
  firstPublishYear: 2000,
  isbn: null,
  coverId: id,
  coverUrl: `https://covers.openlibrary.org/b/id/${id}-L.jpg`,
  pageCount: null,
  subjects: [],
});

const key = (id) => `/works/OL${id}W`;

// A fake client: searchSubject returns canned lists, getWorkDescription can be told to fail.
function makeClient(resultsBySubject, { failFor = [] } = {}) {
  return {
    searchSubject: vi.fn(async (subject) => resultsBySubject[subject] || []),
    getWorkDescription: vi.fn(async (workKey) => {
      if (failFor.includes(workKey)) throw new Error("boom");
      return `About ${workKey}`;
    }),
  };
}

describe("fetchOpenLibraryCatalog", () => {
  it("keeps up to perCategory books and describes only the first N", async () => {
    const client = makeClient({
      mystery: [1, 2, 3, 4, 5].map(makeBook),
      horror: [6, 7, 8, 9, 10].map(makeBook),
    });
    const result = await fetchOpenLibraryCatalog({
      client,
      queries: { Mystery: ["mystery"], Horror: ["horror"] },
      perCategory: 3,
      describePerCategory: 2,
      now: () => new Date("2026-01-01T00:00:00Z"),
    });

    expect(result.source).toBe("openlibrary");
    expect(result.fetchedAt).toBe("2026-01-01T00:00:00.000Z");
    expect(result.categories.Mystery).toHaveLength(3);
    expect(result.categories.Mystery[0].description).toBe("About /works/OL1W");
    expect(result.categories.Mystery[2].description).toBeNull();
    expect(client.getWorkDescription).toHaveBeenCalledTimes(4);
  });

  it("asks for a larger page than it needs, to allow for dropped results", async () => {
    const client = makeClient({ mystery: [makeBook(1)] });
    await fetchOpenLibraryCatalog({
      client,
      queries: { Mystery: ["mystery"] },
      perCategory: 3,
      describePerCategory: 0,
    });
    expect(client.searchSubject).toHaveBeenCalledWith("mystery", { limit: 5 });
  });

  it("tries the next query only when it still needs books, without duplicates", async () => {
    const client = makeClient({
      a: [makeBook(1), makeBook(2)],
      b: [makeBook(2), makeBook(3), makeBook(4)],
    });
    const result = await fetchOpenLibraryCatalog({
      client,
      queries: { Mystery: ["a", "b"] },
      perCategory: 3,
      describePerCategory: 0,
    });
    expect(client.searchSubject).toHaveBeenCalledTimes(2);
    expect(result.categories.Mystery.map((book) => book.externalId)).toEqual([
      key(1),
      key(2),
      key(3),
    ]);

    const enough = makeClient({ a: [1, 2, 3].map(makeBook), b: [makeBook(9)] });
    await fetchOpenLibraryCatalog({
      client: enough,
      queries: { Mystery: ["a", "b"] },
      perCategory: 3,
      describePerCategory: 0,
    });
    expect(enough.searchSubject).toHaveBeenCalledTimes(1);
  });

  it("keeps going when a description fails", async () => {
    const client = makeClient({ x: [makeBook(1), makeBook(2)] }, { failFor: [key(1)] });
    const log = vi.fn();
    const result = await fetchOpenLibraryCatalog({
      client,
      queries: { Mystery: ["x"] },
      perCategory: 2,
      describePerCategory: 2,
      log,
    });
    expect(result.categories.Mystery[0].description).toBeNull();
    expect(result.categories.Mystery[1].description).toBe("About /works/OL2W");
    expect(log).toHaveBeenCalledWith(expect.stringContaining("description failed"));
  });

  it("fetches a description once when a work appears in two categories", async () => {
    const client = makeClient({ m: [makeBook(1), makeBook(2)], f: [makeBook(1), makeBook(3)] });
    const result = await fetchOpenLibraryCatalog({
      client,
      queries: { Mystery: ["m"], Fiction: ["f"] },
      perCategory: 2,
      describePerCategory: 2,
    });
    const calls = client.getWorkDescription.mock.calls.filter(([workKey]) => workKey === key(1));
    expect(calls).toHaveLength(1);
    expect(result.categories.Fiction[0].description).toBe("About /works/OL1W");
  });

  it("skips categories that are already in the existing result", async () => {
    const existing = { categories: { Mystery: [{ ...makeBook(1), description: "old" }] } };
    const client = makeClient({ horror: [makeBook(6)] });
    const result = await fetchOpenLibraryCatalog({
      client,
      queries: { Mystery: ["mystery"], Horror: ["horror"] },
      existing,
      perCategory: 3,
      describePerCategory: 1,
    });
    expect(client.searchSubject).not.toHaveBeenCalledWith("mystery", expect.anything());
    expect(result.categories.Mystery[0].description).toBe("old");
    expect(result.categories.Horror).toHaveLength(1);
  });

  it("reports progress after every category", async () => {
    const client = makeClient({ mystery: [makeBook(1)], horror: [makeBook(2)] });
    const snapshots = [];
    await fetchOpenLibraryCatalog({
      client,
      queries: { Mystery: ["mystery"], Horror: ["horror"] },
      describePerCategory: 0,
      onCategoryDone: async (result) => {
        snapshots.push(Object.keys(result.categories));
      },
    });
    expect(snapshots).toEqual([["Mystery"], ["Mystery", "Horror"]]);
  });

  it("rejects a category that has no queries configured", async () => {
    await expect(
      fetchOpenLibraryCatalog({
        client: makeClient({}),
        queries: { Mystery: ["m"] },
        categories: ["Cooking"],
      }),
    ).rejects.toThrow(/No Open Library queries/);
  });

  it("stops on a failed search but has already reported earlier categories", async () => {
    const client = {
      searchSubject: vi.fn(async (subject) => {
        if (subject === "horror") throw new Error("network down");
        return [makeBook(1)];
      }),
      getWorkDescription: vi.fn(async () => null),
    };
    const snapshots = [];
    await expect(
      fetchOpenLibraryCatalog({
        client,
        queries: { Mystery: ["mystery"], Horror: ["horror"] },
        describePerCategory: 0,
        onCategoryDone: async (result) => {
          snapshots.push(Object.keys(result.categories));
        },
      }),
    ).rejects.toThrow(/network down/);
    expect(snapshots).toEqual([["Mystery"]]);
  });
});

describe("parseFetchArgs", () => {
  const categories = ["Mystery", "Horror"];

  it("returns sensible defaults", () => {
    expect(parseFetchArgs([], categories)).toEqual({
      resume: false,
      perCategory: 40,
      describe: 30,
      only: null,
    });
  });

  it("parses every option", () => {
    const options = parseFetchArgs(
      ["--resume", "--per-category", "5", "--describe", "0", "--only", "Mystery, Horror"],
      categories,
    );
    expect(options).toEqual({
      resume: true,
      perCategory: 5,
      describe: 0,
      only: ["Mystery", "Horror"],
    });
  });

  it("rejects unknown options, bad numbers and unknown categories", () => {
    const bad = [
      ["--nope"],
      ["--per-category"],
      ["--per-category", "0"],
      ["--describe", "x"],
      ["--only", "Cooking"],
      ["--only"],
    ];
    for (const argv of bad) {
      expect(() => parseFetchArgs(argv, categories)).toThrow();
    }
  });
});

describe("OPENLIBRARY_QUERIES", () => {
  it("has queries for exactly the ten categories", () => {
    expect(Object.keys(OPENLIBRARY_QUERIES).sort()).toEqual([...CATEGORIES].sort());
    for (const queries of Object.values(OPENLIBRARY_QUERIES)) {
      expect(queries.length).toBeGreaterThan(0);
      expect(queries.every((query) => typeof query === "string" && query.length > 0)).toBe(true);
    }
  });
});

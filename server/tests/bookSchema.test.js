import { describe, it, expect } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { bookCreateSchema, bookUpdateSchema, catalogBookSchema } = require("../src/schemas/book");

const valid = {
  title: "Lone Women",
  authors: ["Victor LaValle"],
  description: "A gripping horror novel set in 1915 Montana.",
  category: "Horror",
  coverUrl: "https://covers.openlibrary.org/b/id/123-L.jpg",
  pricePaise: 49900,
  stock: 10,
};

const create = (overrides) => bookCreateSchema.safeParse({ ...valid, ...overrides });

function failsAt(result, field) {
  expect(result.success).toBe(false);
  expect(result.error.issues.some((issue) => issue.path[0] === field)).toBe(true);
}

describe("bookCreateSchema", () => {
  it("accepts a minimal valid book, trims strings and applies defaults", () => {
    const result = create({ title: "  Lone Women  " });
    expect(result.success).toBe(true);
    expect(result.data.title).toBe("Lone Women");
    expect(result.data.subjects).toEqual([]);
    expect(result.data.isFeatured).toBe(false);
    expect(result.data.readUrl).toBeUndefined();
  });

  it("rejects fields the client must not set", () => {
    for (const key of ["isActive", "source", "_id", "createdAt"]) {
      expect(create({ [key]: true }).success).toBe(false);
    }
  });

  it("rejects a category outside the fixed list", () => {
    failsAt(create({ category: "Cooking" }), "category");
    failsAt(create({ category: "horror" }), "category");
  });

  it("requires an integer price in paise within range", () => {
    for (const pricePaise of [0, 99, -500, 1000001, 499.5, "49900", null]) {
      failsAt(create({ pricePaise }), "pricePaise");
    }
    expect(create({ pricePaise: 100 }).success).toBe(true);
    expect(create({ pricePaise: 1000000 }).success).toBe(true);
  });

  it("rejects stock that is negative, fractional or not a number", () => {
    for (const stock of [-1, 1.5, 10001, "5"]) {
      failsAt(create({ stock }), "stock");
    }
    expect(create({ stock: 0 }).success).toBe(true);
  });

  it("validates the authors list", () => {
    failsAt(create({ authors: [] }), "authors");
    failsAt(create({ authors: ["A", "B", "C", "D", "E", "F"] }), "authors");
    failsAt(create({ authors: [""] }), "authors");
    failsAt(create({ authors: ["   "] }), "authors");
    failsAt(create({ authors: undefined }), "authors");
    expect(create({ authors: ["A", "B"] }).success).toBe(true);
  });

  it("only accepts http(s) URLs", () => {
    for (const coverUrl of ["javascript:alert(1)", "ftp://example.com/a.jpg", "not a url"]) {
      failsAt(create({ coverUrl }), "coverUrl");
    }
    failsAt(create({ readUrl: "javascript:alert(1)" }), "readUrl");
    failsAt(create({ externalUrl: "data:text/html,hi" }), "externalUrl");
    expect(create({ coverUrl: "http://example.com/a.jpg" }).success).toBe(true);
    expect(create({ readUrl: "https://www.gutenberg.org/ebooks/1" }).success).toBe(true);
  });

  it("normalizes ISBNs and rejects invalid ones", () => {
    expect(create({ isbn: "978-0-14-312774-1" }).data.isbn).toBe("9780143127741");
    expect(create({ isbn: "080442957x" }).data.isbn).toBe("080442957X");
    failsAt(create({ isbn: "12345" }), "isbn");
  });

  it("limits subjects to 10 short tags", () => {
    const tags = Array.from({ length: 10 }, (_, i) => `tag ${i}`);
    expect(create({ subjects: tags }).success).toBe(true);
    failsAt(create({ subjects: [...tags, "one too many"] }), "subjects");
    failsAt(create({ subjects: ["x".repeat(41)] }), "subjects");
  });

  it("bounds page count and published year", () => {
    for (const pageCount of [0, 1.5, 10001]) failsAt(create({ pageCount }), "pageCount");
    for (const publishedYear of [999, 3000]) failsAt(create({ publishedYear }), "publishedYear");
    expect(create({ pageCount: 320, publishedYear: 1925 }).success).toBe(true);
  });
});

describe("bookUpdateSchema", () => {
  it("accepts a partial update without adding defaults", () => {
    const result = bookUpdateSchema.safeParse({ stock: 5 });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ stock: 5 });
  });

  it("rejects an empty update", () => {
    expect(bookUpdateSchema.safeParse({}).success).toBe(false);
  });

  it("still validates the fields it receives", () => {
    failsAt(bookUpdateSchema.safeParse({ category: "Cooking" }), "category");
    failsAt(bookUpdateSchema.safeParse({ pricePaise: 12.5 }), "pricePaise");
  });

  it("rejects unknown fields", () => {
    expect(bookUpdateSchema.safeParse({ stock: 1, isActive: false }).success).toBe(false);
  });
});

describe("catalogBookSchema", () => {
  const entry = {
    ...valid,
    isFeatured: false,
    subjects: ["horror", "montana"],
    source: { provider: "openlibrary", externalId: "/works/OL123W" },
  };

  it("accepts an imported book with a source", () => {
    expect(catalogBookSchema.safeParse(entry).success).toBe(true);
  });

  it("requires externalId for imported books but not for manual ones", () => {
    failsAt(catalogBookSchema.safeParse({ ...entry, source: { provider: "gutendex" } }), "source");
    expect(catalogBookSchema.safeParse({ ...entry, source: { provider: "manual" } }).success).toBe(
      true,
    );
  });

  it("rejects an unknown provider", () => {
    failsAt(
      catalogBookSchema.safeParse({ ...entry, source: { provider: "amazon", externalId: "1" } }),
      "source",
    );
  });
});

import { describe, it, expect, vi } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createHttpClient } = require("../scripts/lib/http");
const {
  createOpenLibraryClient,
  parseSearchDoc,
  parseDescription,
  cleanSubjects,
  pickIsbn,
  coverUrl,
} = require("../scripts/lib/openlibrary");

const jsonResponse = (body, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

// Builds an HTTP client whose fetch returns the queued responses, with no real waiting.
function makeClient(responses, overrides = {}) {
  const queue = [...responses];
  const fetchImpl = vi.fn(async () => {
    const next = queue.shift();
    if (next instanceof Error) throw next;
    return next;
  });
  const sleeps = [];
  const client = createHttpClient({
    fetchImpl,
    sleepImpl: async (ms) => {
      sleeps.push(ms);
    },
    nowImpl: () => 1000,
    minIntervalMs: 1000,
    retryDelayMs: 50,
    ...overrides,
  });
  return { client, fetchImpl, sleeps };
}

const goodDoc = {
  key: "/works/OL893415W",
  title: " Dune ",
  author_name: ["Frank Herbert"],
  first_publish_year: 1965,
  isbn: ["0441172717", "9780441172719"],
  cover_i: 12345,
  number_of_pages_median: 412,
  subject: ["Science fiction", "Deserts"],
};

describe("parseSearchDoc", () => {
  it("maps a search result into our shape", () => {
    expect(parseSearchDoc(goodDoc)).toEqual({
      externalId: "/works/OL893415W",
      title: "Dune",
      authors: ["Frank Herbert"],
      firstPublishYear: 1965,
      isbn: "9780441172719",
      coverId: 12345,
      coverUrl: "https://covers.openlibrary.org/b/id/12345-L.jpg",
      pageCount: 412,
      subjects: ["Science fiction", "Deserts"],
    });
  });

  it("uses null or empty values for optional data", () => {
    const result = parseSearchDoc({
      key: "/works/OL1W",
      title: "A",
      author_name: ["B"],
      cover_i: 1,
    });
    expect(result.firstPublishYear).toBeNull();
    expect(result.isbn).toBeNull();
    expect(result.pageCount).toBeNull();
    expect(result.subjects).toEqual([]);
  });

  it("skips results without a key, title, author or cover", () => {
    for (const missing of ["key", "title", "author_name", "cover_i"]) {
      const doc = { ...goodDoc };
      delete doc[missing];
      expect(parseSearchDoc(doc)).toBeNull();
    }
  });

  it("removes duplicate authors ignoring case and keeps at most five", () => {
    const doc = { ...goodDoc, author_name: ["A", "a", "B", "C", "D", "E", "F"] };
    expect(parseSearchDoc(doc).authors).toEqual(["A", "B", "C", "D", "E"]);
  });
});

describe("pickIsbn and coverUrl", () => {
  it("prefers an ISBN-13, falls back to an ISBN-10, otherwise null", () => {
    expect(pickIsbn(["0441172717", "9780441172719"])).toBe("9780441172719");
    expect(pickIsbn(["0441172717"])).toBe("0441172717");
    expect(pickIsbn(["abc", "123"])).toBeNull();
    expect(pickIsbn(undefined)).toBeNull();
  });

  it("builds cover URLs in the requested size", () => {
    expect(coverUrl(7)).toBe("https://covers.openlibrary.org/b/id/7-L.jpg");
    expect(coverUrl(7, "M")).toBe("https://covers.openlibrary.org/b/id/7-M.jpg");
  });
});

describe("cleanSubjects", () => {
  it("trims, removes duplicates, noise and overly long tags", () => {
    const result = cleanSubjects([
      " Mystery ",
      "mystery",
      "Accessible book",
      "In library",
      "x".repeat(41),
      "Detectives",
      "NYT:Hardcover Fiction",
    ]);
    expect(result).toEqual(["Mystery", "Detectives"]);
  });

  it("caps the number of subjects", () => {
    const many = Array.from({ length: 40 }, (_, i) => `subject ${i}`);
    expect(cleanSubjects(many)).toHaveLength(25);
    expect(cleanSubjects(many, 3)).toHaveLength(3);
  });
});

describe("parseDescription", () => {
  it("reads plain strings and { value } objects", () => {
    expect(parseDescription({ description: "A tale." })).toBe("A tale.");
    expect(parseDescription({ description: { type: "/type/text", value: "Another tale." } })).toBe(
      "Another tale.",
    );
  });

  it("strips markdown links and everything after a dashed line", () => {
    const description =
      "Hello [world](http://x.y).\r\n\r\n\r\n\r\nMore.\r\n----------\r\nSource notes";
    expect(parseDescription({ description })).toBe("Hello world.\n\nMore.");
  });

  it("returns null when there is no usable description", () => {
    expect(parseDescription({})).toBeNull();
    expect(parseDescription({ description: "   " })).toBeNull();
    expect(parseDescription({ description: { value: 42 } })).toBeNull();
  });

  it("caps the length at 5000 characters", () => {
    expect(parseDescription({ description: "x".repeat(6000) })).toHaveLength(5000);
  });
});

describe("createHttpClient", () => {
  it("returns parsed JSON and sends a User-Agent", async () => {
    const { client, fetchImpl } = makeClient([jsonResponse({ ok: 1 })], {
      userAgent: "test-agent",
    });
    expect(await client.getJson("https://example.com/a")).toEqual({ ok: 1 });

    const [url, options] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://example.com/a");
    expect(options.headers["User-Agent"]).toBe("test-agent");
  });

  it("waits between requests", async () => {
    const { client, sleeps } = makeClient([jsonResponse({}), jsonResponse({})]);
    await client.getJson("https://example.com/1");
    await client.getJson("https://example.com/2");
    expect(sleeps).toEqual([1000]);
  });

  it("retries 5xx responses and network errors, then succeeds", async () => {
    const { client, fetchImpl, sleeps } = makeClient([
      jsonResponse({}, 500),
      new TypeError("network down"),
      jsonResponse({ ok: 1 }),
    ]);
    expect(await client.getJson("https://example.com/a")).toEqual({ ok: 1 });
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(sleeps).toEqual([50, 1000, 100, 1000]);
  });

  it("does not retry a 404", async () => {
    const { client, fetchImpl } = makeClient([jsonResponse({}, 404)]);
    await expect(client.getJson("https://example.com/missing")).rejects.toMatchObject({
      name: "HttpError",
      status: 404,
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("gives up after the configured retries and throws the last error", async () => {
    const { client, fetchImpl } = makeClient([
      jsonResponse({}, 503),
      jsonResponse({}, 503),
      jsonResponse({}, 503),
    ]);
    await expect(client.getJson("https://example.com/a")).rejects.toMatchObject({ status: 503 });
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });
});

describe("createOpenLibraryClient", () => {
  it("searches by subject and drops unusable results", async () => {
    const http = { getJson: vi.fn() };
    http.getJson.mockResolvedValueOnce({ docs: [goodDoc, { ...goodDoc, cover_i: undefined }] });

    const results = await createOpenLibraryClient(http).searchSubject("mystery", { limit: 5 });
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe("Dune");

    const url = http.getJson.mock.calls[0][0];
    expect(url).toContain("https://openlibrary.org/search.json?");
    expect(url).toContain("limit=5");
    expect(decodeURIComponent(url)).toContain('subject:"mystery"');
  });

  it("rejects work keys that are not Open Library works", async () => {
    const client = createOpenLibraryClient({ getJson: vi.fn() });
    await expect(client.getWorkDescription("/authors/OL1A")).rejects.toThrow(
      /Invalid Open Library work key/,
    );
  });

  it("fetches and parses a work description", async () => {
    const http = { getJson: vi.fn().mockResolvedValueOnce({ description: "A tale." }) };
    const description = await createOpenLibraryClient(http).getWorkDescription("/works/OL45883W");
    expect(description).toBe("A tale.");
    expect(http.getJson).toHaveBeenCalledWith("https://openlibrary.org/works/OL45883W.json");
  });
});

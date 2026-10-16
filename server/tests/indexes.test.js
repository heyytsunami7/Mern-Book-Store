import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { createRequire } from "node:module";
import { startTestDb } from "./helpers.js";

const require = createRequire(import.meta.url);
const { ensureIndexes } = require("../src/db");

let ctx;

beforeAll(async () => {
  ctx = await startTestDb();
}, 120000);

afterAll(async () => {
  if (ctx) await ctx.stop();
});

beforeEach(async () => {
  for (const name of ["books", "carts", "orders"]) {
    await ctx.db.collection(name).deleteMany({});
  }
});

const indexNames = async (collection) =>
  (await ctx.db.collection(collection).indexes()).map((index) => index.name);

describe("ensureIndexes", () => {
  it("creates the expected indexes on every collection", async () => {
    expect(await indexNames("users")).toContain("firebaseUid_1");
    expect(await indexNames("books")).toEqual(
      expect.arrayContaining([
        "isbn_unique",
        "source_unique",
        "books_text",
        "category_price",
        "active_created",
        "featured",
      ]),
    );
    expect(await indexNames("carts")).toContain("userUid_unique");
    expect(await indexNames("orders")).toEqual(
      expect.arrayContaining([
        "orderNumber_unique",
        "user_created",
        "status_expires",
        "items_bookId",
        "razorpayOrderId_unique",
      ]),
    );
  });

  it("enforces unique ISBNs only for books that have one", async () => {
    const books = ctx.db.collection("books");
    await books.insertOne({ title: "No ISBN A" });
    await books.insertOne({ title: "No ISBN B" });
    await books.insertOne({ title: "C", isbn: "9780143127741" });
    await expect(books.insertOne({ title: "D", isbn: "9780143127741" })).rejects.toThrow(
      /duplicate key/i,
    );
    await books.insertOne({ title: "E", isbn: "080442957X" });
  });

  it("enforces one book per source provider and external id", async () => {
    const books = ctx.db.collection("books");
    await books.insertOne({
      title: "A",
      source: { provider: "openlibrary", externalId: "/works/OL1W" },
    });
    await expect(
      books.insertOne({
        title: "B",
        source: { provider: "openlibrary", externalId: "/works/OL1W" },
      }),
    ).rejects.toThrow(/duplicate key/i);

    // The same id under another provider is a different book, and manual books may repeat.
    await books.insertOne({
      title: "C",
      source: { provider: "gutendex", externalId: "/works/OL1W" },
    });
    await books.insertOne({ title: "D", source: { provider: "manual" } });
    await books.insertOne({ title: "E", source: { provider: "manual" } });
  });

  it("supports weighted text search on title, authors and description", async () => {
    const books = ctx.db.collection("books");
    await books.insertMany([
      { title: "Dune", authors: ["Frank Herbert"], description: "A desert planet saga." },
      { title: "Emma", authors: ["Jane Austen"], description: "A comedy of manners." },
    ]);

    const byAuthor = await books.find({ $text: { $search: "herbert" } }).toArray();
    expect(byAuthor.map((book) => book.title)).toEqual(["Dune"]);

    const byTitle = await books.find({ $text: { $search: "emma" } }).toArray();
    expect(byTitle.map((book) => book.title)).toEqual(["Emma"]);

    const textIndex = (await books.indexes()).find((index) => index.name === "books_text");
    expect(textIndex.weights).toEqual({ title: 10, authors: 5, description: 1 });
  });

  it("allows only one cart per user", async () => {
    const carts = ctx.db.collection("carts");
    await carts.insertOne({ userUid: "u1", items: [] });
    await expect(carts.insertOne({ userUid: "u1", items: [] })).rejects.toThrow(/duplicate key/i);
    await carts.insertOne({ userUid: "u2", items: [] });
  });

  it("keeps order numbers unique and Razorpay order ids unique when present", async () => {
    const orders = ctx.db.collection("orders");
    await orders.insertOne({ orderNumber: "BS-1", userUid: "u1" });
    await expect(orders.insertOne({ orderNumber: "BS-1", userUid: "u2" })).rejects.toThrow(
      /duplicate key/i,
    );

    // Orders without a Razorpay order id may repeat (sparse unique index).
    await orders.insertOne({ orderNumber: "BS-2", userUid: "u1" });
    await orders.insertOne({
      orderNumber: "BS-3",
      userUid: "u1",
      payment: { provider: "razorpay" },
    });

    await orders.insertOne({ orderNumber: "BS-4", payment: { razorpayOrderId: "order_1" } });
    await expect(
      orders.insertOne({ orderNumber: "BS-5", payment: { razorpayOrderId: "order_1" } }),
    ).rejects.toThrow(/duplicate key/i);
  });

  it("can run more than once without errors or extra indexes", async () => {
    const before = await indexNames("books");
    await expect(ensureIndexes(ctx.db)).resolves.toBeUndefined();
    await expect(ensureIndexes(ctx.db)).resolves.toBeUndefined();
    expect(await indexNames("books")).toEqual(before);
  });
});

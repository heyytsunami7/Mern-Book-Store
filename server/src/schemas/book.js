const { z } = require("zod");
const { CATEGORIES } = require("../constants");

const SOURCE_PROVIDERS = Object.freeze(["openlibrary", "gutendex", "manual"]);

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// Only http(s) links: a plain z.url() would also accept javascript: and data: URLs.
const httpUrl = z.string().trim().max(2000).refine(isHttpUrl, "Must be an http(s) URL");

const title = z.string().trim().min(1).max(200);
const authors = z.array(z.string().trim().min(1).max(100)).min(1).max(5);
const description = z.string().trim().min(1).max(5000);
const category = z.enum(CATEGORIES);
const subjects = z.array(z.string().trim().min(1).max(40)).max(10);
const isbn = z
  .string()
  .trim()
  .transform((value) => value.replace(/[-\s]/g, "").toUpperCase())
  .pipe(z.string().regex(/^(\d{9}[\dX]|\d{13})$/, "Must be a valid ISBN-10 or ISBN-13"));
const pageCount = z.number().int().min(1).max(10000);
const publishedYear = z
  .number()
  .int()
  .min(1000)
  .max(new Date().getFullYear() + 1);
const pricePaise = z.number().int().min(100).max(1000000); // ₹1 to ₹10,000
const stock = z.number().int().min(0).max(10000);

// Admin "create book" request body. The server sets isActive, source and timestamps itself.
const bookCreateSchema = z.strictObject({
  title,
  authors,
  description,
  category,
  coverUrl: httpUrl,
  pricePaise,
  stock,
  subjects: subjects.default([]),
  readUrl: httpUrl.optional(),
  externalUrl: httpUrl.optional(),
  isbn: isbn.optional(),
  pageCount: pageCount.optional(),
  publishedYear: publishedYear.optional(),
  isFeatured: z.boolean().default(false),
});

// Admin "update book" request body: every field optional, at least one required.
// No defaults here, so a PATCH never overwrites a field it did not send.
const bookUpdateSchema = z
  .strictObject({
    title: title.optional(),
    authors: authors.optional(),
    description: description.optional(),
    category: category.optional(),
    coverUrl: httpUrl.optional(),
    pricePaise: pricePaise.optional(),
    stock: stock.optional(),
    subjects: subjects.optional(),
    readUrl: httpUrl.optional(),
    externalUrl: httpUrl.optional(),
    isbn: isbn.optional(),
    pageCount: pageCount.optional(),
    publishedYear: publishedYear.optional(),
    isFeatured: z.boolean().optional(),
  })
  .refine((update) => Object.keys(update).length > 0, {
    message: "Provide at least one field to update",
  });

// One entry of data/catalog.json (the merged Open Library + Gutendex catalog).
const catalogBookSchema = bookCreateSchema
  .extend({
    source: z.strictObject({
      provider: z.enum(SOURCE_PROVIDERS),
      externalId: z.string().min(1).optional(),
    }),
  })
  .refine((book) => book.source.provider === "manual" || Boolean(book.source.externalId), {
    message: "source.externalId is required for imported books",
    path: ["source", "externalId"],
  });

module.exports = {
  SOURCE_PROVIDERS,
  bookCreateSchema,
  bookUpdateSchema,
  catalogBookSchema,
};

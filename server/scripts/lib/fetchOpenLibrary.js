const { OPENLIBRARY_QUERIES } = require("./categories");

/**
 * Collects books per category from Open Library.
 *
 * client: { searchSubject(subject, { limit }), getWorkDescription(workKey) }
 * existing: a previous result to continue from. Categories already in it are skipped.
 * onCategoryDone(result): called after every category so the caller can save progress.
 *
 * A failed description only leaves that book without one. A failed search stops the run,
 * and everything finished so far has already been passed to onCategoryDone.
 */
async function fetchOpenLibraryCatalog({
  client,
  queries = OPENLIBRARY_QUERIES,
  categories = Object.keys(queries),
  perCategory = 40,
  describePerCategory = 30,
  existing = null,
  onCategoryDone = async () => {},
  log = () => {},
  now = () => new Date(),
}) {
  const result = {
    source: "openlibrary",
    fetchedAt: now().toISOString(),
    categories: { ...(existing?.categories || {}) },
  };

  // A work can show up in several categories; fetch its description only once.
  const descriptions = new Map();
  for (const books of Object.values(result.categories)) {
    for (const book of books) {
      if (book.description) descriptions.set(book.externalId, book.description);
    }
  }

  for (const category of categories) {
    if (!queries[category]) {
      throw new Error(`No Open Library queries configured for category: ${category}`);
    }
    if (result.categories[category]) {
      log(`skip ${category} (already fetched)`);
      continue;
    }

    const books = [];
    const seen = new Set();
    for (const subject of queries[category]) {
      if (books.length >= perCategory) break;
      log(`search ${category}: ${subject}`);
      // Ask for more than we need, because some results are dropped for lacking a cover.
      const found = await client.searchSubject(subject, { limit: Math.ceil(perCategory * 1.5) });
      for (const book of found) {
        if (books.length >= perCategory) break;
        if (seen.has(book.externalId)) continue;
        seen.add(book.externalId);
        books.push({ ...book, description: null });
      }
    }

    for (const [index, book] of books.entries()) {
      if (index >= describePerCategory) break;
      if (descriptions.has(book.externalId)) {
        book.description = descriptions.get(book.externalId);
        continue;
      }
      try {
        book.description = await client.getWorkDescription(book.externalId);
      } catch (err) {
        log(`description failed for ${book.externalId}: ${err.message}`);
        book.description = null;
      }
      if (book.description) descriptions.set(book.externalId, book.description);
    }

    result.categories[category] = books;
    log(`done ${category}: ${books.length} books`);
    await onCategoryDone(result);
  }

  return result;
}

function wholeNumber(flag, value, min, max) {
  const number = Number(value);
  if (value === undefined || !Number.isInteger(number) || number < min || number > max) {
    throw new Error(`${flag} needs a whole number between ${min} and ${max}`);
  }
  return number;
}

// Command line options for scripts/fetch-openlibrary.js.
function parseFetchArgs(argv, allCategories) {
  const options = { resume: false, perCategory: 40, describe: 30, only: null };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--resume") {
      options.resume = true;
    } else if (arg === "--per-category") {
      options.perCategory = wholeNumber(arg, argv[i + 1], 1, 200);
      i += 1;
    } else if (arg === "--describe") {
      options.describe = wholeNumber(arg, argv[i + 1], 0, 200);
      i += 1;
    } else if (arg === "--only") {
      const names = (argv[i + 1] || "")
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean);
      const unknown = names.filter((name) => !allCategories.includes(name));
      if (names.length === 0 || unknown.length > 0) {
        throw new Error(
          `--only needs known categories. Unknown: ${unknown.join(", ") || "(none given)"}`,
        );
      }
      options.only = names;
      i += 1;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  return options;
}

module.exports = { fetchOpenLibraryCatalog, parseFetchArgs };

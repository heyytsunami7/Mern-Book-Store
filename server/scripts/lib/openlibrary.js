const BASE_URL = "https://openlibrary.org";
const COVERS_URL = "https://covers.openlibrary.org";

const SEARCH_FIELDS = [
  "key",
  "title",
  "author_name",
  "first_publish_year",
  "isbn",
  "cover_i",
  "number_of_pages_median",
  "subject",
];

// Library-catalogue tags that say nothing about what a book is about.
const NOISE_SUBJECT =
  /accessible book|protected daisy|in library|lending library|overdrive|large type|reading level|^nyt:|^new york times/i;

function coverUrl(coverId, size = "L") {
  return `${COVERS_URL}/b/id/${coverId}-${size}.jpg`;
}

function searchUrl({ subject, limit = 40, page = 1 }) {
  const params = new URLSearchParams({
    q: `subject:"${subject}"`,
    limit: String(limit),
    page: String(page),
    fields: SEARCH_FIELDS.join(","),
  });
  return `${BASE_URL}/search.json?${params.toString()}`;
}

function uniqueStrings(values) {
  const seen = new Set();
  const out = [];
  for (const value of values || []) {
    const text = typeof value === "string" ? value.trim() : "";
    const key = text.toLowerCase();
    if (text && !seen.has(key)) {
      seen.add(key);
      out.push(text);
    }
  }
  return out;
}

function cleanSubjects(subjects, max = 25) {
  return uniqueStrings(subjects)
    .filter((subject) => subject.length <= 40 && !NOISE_SUBJECT.test(subject))
    .slice(0, max);
}

// Prefer an ISBN-13, fall back to an ISBN-10, otherwise null.
function pickIsbn(isbns) {
  const list = (isbns || []).filter((value) => typeof value === "string");
  return (
    list.find((value) => /^\d{13}$/.test(value)) ||
    list.find((value) => /^\d{9}[\dX]$/.test(value)) ||
    null
  );
}

// Turns one search result into our shape, or null if it lacks a title, author or cover.
function parseSearchDoc(doc) {
  const title = typeof doc.title === "string" ? doc.title.trim() : "";
  const authors = uniqueStrings(doc.author_name).slice(0, 5);
  if (!doc.key || !title || authors.length === 0 || !doc.cover_i) return null;

  return {
    externalId: doc.key,
    title,
    authors,
    firstPublishYear: doc.first_publish_year ?? null,
    isbn: pickIsbn(doc.isbn),
    coverId: doc.cover_i,
    coverUrl: coverUrl(doc.cover_i, "L"),
    pageCount: doc.number_of_pages_median ?? null,
    subjects: cleanSubjects(doc.subject),
  };
}

// A work's description is either a string or { type, value }, often with markdown and a footer.
function parseDescription(work) {
  const raw = typeof work.description === "string" ? work.description : work.description?.value;
  if (typeof raw !== "string") return null;

  const text = raw
    .replace(/\r\n/g, "\n")
    .split(/\n-{5,}/)[0] // everything after a dashed line is source notes, not the blurb
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // [text](url) -> text
    .replace(/^\[\d+\]:.*$/gm, "") // reference-style link lines
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 5000);

  return text || null;
}

function createOpenLibraryClient(http) {
  return {
    async searchSubject(subject, { limit = 40, page = 1 } = {}) {
      const data = await http.getJson(searchUrl({ subject, limit, page }));
      return (data.docs || []).map(parseSearchDoc).filter(Boolean);
    },

    async getWorkDescription(workKey) {
      if (!/^\/works\/OL\d+W$/.test(workKey)) {
        throw new Error(`Invalid Open Library work key: ${workKey}`);
      }
      return parseDescription(await http.getJson(`${BASE_URL}${workKey}.json`));
    },
  };
}

module.exports = {
  createOpenLibraryClient,
  parseSearchDoc,
  parseDescription,
  cleanSubjects,
  pickIsbn,
  coverUrl,
  searchUrl,
};

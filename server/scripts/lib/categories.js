// Open Library subject queries for each of our ten categories. They are tried in order
// until enough usable books (with a cover) have been found for that category.
const OPENLIBRARY_QUERIES = Object.freeze({
  Fiction: ["fiction"],
  "Non-Fiction": ["nonfiction", "essays"],
  Mystery: ["mystery", "detective and mystery stories"],
  Fantasy: ["fantasy"],
  Horror: ["horror"],
  Humor: ["humor"],
  Biography: ["biography"],
  Psychology: ["psychology"],
  History: ["history"],
  Business: ["business"],
});

module.exports = { OPENLIBRARY_QUERIES };

// Vercel entry point: exports the app only. Vercel handles listening, and the database
// connection is created lazily and reused (see src/db.js).
const { buildApp } = require("./src/bootstrap");

const { app } = buildApp();

module.exports = app;

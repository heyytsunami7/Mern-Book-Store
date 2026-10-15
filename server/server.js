// Local entry point: connects to the database, then listens.
const { buildApp } = require("./src/bootstrap");

const { app, config, getDb } = buildApp();

getDb()
  .then(() => {
    app.listen(config.PORT, () => {
      console.log(`API listening on http://localhost:${config.PORT} (db: ${config.DB_NAME})`);
    });
  })
  .catch((err) => {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  });

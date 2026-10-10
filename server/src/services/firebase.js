const admin = require("firebase-admin");

/**
 * Returns an async function (idToken) => decodedToken.
 * Tests never call this; they inject their own fake verifier into createApp.
 */
function createFirebaseVerifier(serviceAccountRaw) {
  if (!admin.apps.length) {
    const raw = (serviceAccountRaw || "").trim();
    if (raw) {
      let serviceAccount;
      try {
        serviceAccount = JSON.parse(raw);
      } catch (err) {
        throw new Error(`FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON: ${err.message}`, {
          cause: err,
        });
      }
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    } else {
      console.warn(
        "FIREBASE_SERVICE_ACCOUNT_KEY is not set: every authenticated request will be rejected.",
      );
      admin.initializeApp();
    }
  }
  return (idToken) => admin.auth().verifyIdToken(idToken);
}

module.exports = { createFirebaseVerifier };

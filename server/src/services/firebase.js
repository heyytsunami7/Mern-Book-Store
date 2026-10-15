const { initializeApp, getApps, getApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

/**
 * Returns an async function (idToken) => decodedToken.
 * Tests never call this; they inject their own fake verifier into createApp.
 */
function createFirebaseVerifier(serviceAccountRaw) {
  if (!getApps().length) {
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
      initializeApp({ credential: cert(serviceAccount) });
    } else {
      console.warn(
        "FIREBASE_SERVICE_ACCOUNT_KEY is not set: every authenticated request will be rejected.",
      );
      initializeApp();
    }
  }
  return (idToken) => getAuth(getApp()).verifyIdToken(idToken);
}

module.exports = { createFirebaseVerifier };

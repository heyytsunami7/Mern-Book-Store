const DEFAULT_USER_AGENT = "Mern-Book-Store catalog script (portfolio project)";

class HttpError extends Error {
  constructor(message, status, url) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.url = url;
  }

  // Rate limits and server errors are worth retrying; other 4xx errors will not change.
  get retryable() {
    return this.status === 429 || this.status >= 500;
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * A small, polite JSON client for the catalog scripts.
 *  - waits at least minIntervalMs between requests (call getJson one request at a time)
 *  - sends a User-Agent (Open Library asks for one; set CATALOG_USER_AGENT to include your email)
 *  - retries network errors, 429 and 5xx responses with a growing delay
 * fetchImpl, sleepImpl and nowImpl can be replaced, which is how the tests run without a network.
 */
function createHttpClient({
  fetchImpl = globalThis.fetch,
  minIntervalMs = 1000,
  retries = 2,
  retryDelayMs = 1500,
  timeoutMs = 20000,
  userAgent = process.env.CATALOG_USER_AGENT || DEFAULT_USER_AGENT,
  sleepImpl = sleep,
  nowImpl = Date.now,
} = {}) {
  let lastRequestAt = 0;

  async function throttle() {
    const wait = lastRequestAt + minIntervalMs - nowImpl();
    if (wait > 0) await sleepImpl(wait);
    lastRequestAt = nowImpl();
  }

  async function getJson(url) {
    let lastError;
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      await throttle();
      try {
        const res = await fetchImpl(url, {
          headers: { "User-Agent": userAgent, Accept: "application/json" },
          signal: AbortSignal.timeout(timeoutMs),
        });
        if (!res.ok) throw new HttpError(`HTTP ${res.status} for ${url}`, res.status, url);
        return await res.json();
      } catch (err) {
        if (err instanceof HttpError && !err.retryable) throw err;
        lastError = err;
      }
      if (attempt < retries) await sleepImpl(retryDelayMs * (attempt + 1));
    }
    throw lastError;
  }

  return { getJson };
}

module.exports = { createHttpClient, HttpError, DEFAULT_USER_AGENT };

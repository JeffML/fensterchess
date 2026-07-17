export const authenticateRequest = (event) => {
  const origin = event.headers.origin || event.headers.referer;
  const authHeader = event.headers.authorization;

  // Production domains - these can be public
  const allowedOrigins = [
    "https://fensterchess.com",
    "https://fensterchess.netlify.app",
    "http://localhost:8888", // netlify dev
    "http://localhost:5173", // vite dev default
    "http://localhost:3000", // vite dev alt
    "http://localhost:3001", // vite dev alt
  ];

  if (origin) {
    try {
      const { hostname } = new URL(origin);
      if (allowedOrigins.some((allowed) => new URL(allowed).hostname === hostname)) {
        return true;
      }
    } catch (_) {
      // Malformed origin — fall through to token check
    }
  }

  // Secret token for other access (e.g., curl, scripts, non-browser clients).
  // NOTE: VITE_ prefix means this value is inlined into the client bundle at build time,
  // so it's visible in browser dev tools. This is acceptable because:
  //   (a) The origin check above already allows fensterchess.com and localhost,
  //   (b) These are read-only functions returning public chess data,
  //   (c) The token serves as a soft rate-limiter against casual scraping, not as a security boundary.
  const validToken = process.env.VITE_API_SECRET_TOKEN;
  if (authHeader === `Bearer ${validToken}`) {
    return true;
  }

  console.error(JSON.stringify({ AuthFailure: { origin, authHeader } }));
  return false;
};

export const authFailureResponse = {
  statusCode: 401,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ error: "Unauthorized" }),
};

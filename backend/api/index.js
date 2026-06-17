// Vercel serverless entry point for the RIWAYA API.
//
// On Vercel the Express app does NOT call app.listen() — every incoming request
// is handed to this exported handler instead. App construction and the (cached)
// MongoDB connection are deferred into the handler and wrapped in try/catch, so
// ANY cold-start failure (missing env var, DB unreachable, bad import) returns a
// clean JSON 500 with the cause logged — instead of an opaque function crash —
// and is retried on the next request. Warm invocations reuse the cached app and
// connection instantly. Local development still uses src/server.js (npm run dev).
let appPromise = null;

const getApp = () => {
  if (!appPromise) {
    appPromise = (async () => {
      const { createApp } = await import('../src/app.js');
      const { connectDB } = await import('../src/config/db.js');
      await connectDB();
      return createApp();
    })().catch((err) => {
      appPromise = null; // reset so the next request can retry initialization
      throw err;
    });
  }
  return appPromise;
};

export default async function handler(req, res) {
  try {
    const app = await getApp();
    // Vercel's catch-all rewrite can hand the bare root request an empty/odd
    // req.url; normalize it so Express routes '/' cleanly instead of crashing
    // the function (FUNCTION_INVOCATION_FAILED).
    if (!req.url) req.url = '/';
    return app(req, res);
  } catch (err) {
    console.error('RIWAYA API initialization failed:', err?.message);
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ success: false, message: 'Server initialization failed' }));
  }
}

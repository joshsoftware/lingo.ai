import { createRouteHandler } from "uploadthing/next";

import { ourFileRouter } from "./core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;


// Export routes for Next App Router
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
  config: {
    callbackUrl: process.env.UPLOADTHING_CALLBACKURL,
  },
  // Apply an (optional) custom config:
  // config: { ... },
});

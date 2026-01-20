import { httpRouter } from "convex/server";

const http = httpRouter();

// Add custom HTTP endpoints here if needed
// Example:
// http.route({
//   path: "/api/webhook",
//   method: "POST",
//   handler: httpAction(async (ctx, req) => {
//     // Handle webhook
//   }),
// });

export default http;

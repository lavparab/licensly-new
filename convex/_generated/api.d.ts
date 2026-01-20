/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as aiInsights from "../aiInsights.js";
import type * as auth from "../auth.js";
import type * as environmental from "../environmental.js";
import type * as gamification from "../gamification.js";
import type * as http from "../http.js";
import type * as licenses from "../licenses.js";
import type * as organizations from "../organizations.js";
import type * as router from "../router.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  aiInsights: typeof aiInsights;
  auth: typeof auth;
  environmental: typeof environmental;
  gamification: typeof gamification;
  http: typeof http;
  licenses: typeof licenses;
  organizations: typeof organizations;
  router: typeof router;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api, internal } from "./_generated/api";
import { QueryCtx, MutationCtx, ActionCtx } from "./_generated/server";

// Get user's organization
async function getUserOrganization(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  
  const userProfile = await ctx.db
    .query("userProfiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();
  
  if (!userProfile) throw new Error("User profile not found");
  return userProfile.organizationId;
}

// Get AI insights for organization
export const getInsights = query({
  args: {
    type: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const organizationId = await getUserOrganization(ctx);
    
    let query = ctx.db
      .query("aiInsights")
      .withIndex("by_organization", (q) => q.eq("organizationId", organizationId));
    
    if (args.type) {
      query = query.filter((q) => q.eq(q.field("type"), args.type));
    }
    
    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }
    
    const insights = await query.order("desc").collect();
    
    // Enrich with license data
    const enrichedInsights = await Promise.all(
      insights.map(async (insight) => {
        if (insight.licenseId) {
          const license = await ctx.db.get(insight.licenseId);
          return { ...insight, license };
        }
        return insight;
      })
    );
    
    return enrichedInsights;
  },
});

// Generate AI insights for unused licenses
export const generateUnusedLicenseInsights = action({
  args: {},
  handler: async (ctx: ActionCtx): Promise<number> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    // Get user's organization
    const userProfile = await ctx.runQuery(api.aiInsights.getUserProfile, { userId });
    if (!userProfile) throw new Error("User profile not found");
    
    const organizationId = userProfile.organizationId;
    
    // Get all active licenses
    const licenses = await ctx.runQuery(api.aiInsights.getActiveLicenses, { organizationId });
    
    const insights = [];
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    for (const license of licenses) {
      // Get usage data for this license
      const usage = await ctx.runQuery(api.aiInsights.getLicenseUsage, { licenseId: license._id });
      
      // Calculate unused seats
      const activeUsers = usage.filter((u: any) => u.lastActiveDate > thirtyDaysAgo).length;
      const unusedSeats = license.totalSeats - activeUsers;
      
      if (unusedSeats > 0) {
        const potentialSavings = unusedSeats * license.costPerSeat * 
          (license.billingCycle === "monthly" ? 12 : 1);
        
        const confidence = Math.min(95, 60 + (unusedSeats / license.totalSeats) * 35);
        
        insights.push({
          organizationId,
          licenseId: license._id,
          type: "unused_license" as const,
          severity: unusedSeats > license.totalSeats * 0.5 ? "high" as const : "medium" as const,
          title: `${unusedSeats} unused seats in ${license.name}`,
          description: `${unusedSeats} out of ${license.totalSeats} seats haven't been used in the last 30 days. Consider reducing your subscription.`,
          potentialSavings,
          confidence,
          status: "new" as const,
          metadata: {
            unusedDays: 30,
            recommendedAction: `Reduce subscription by ${unusedSeats} seats`,
          },
        });
      }
    }
    
    // Save insights to database
    for (const insight of insights) {
      await ctx.runMutation(api.aiInsights.createInsight, insight);
    }
    
    return insights.length;
  },
});

// Internal queries for AI processing
export const getUserProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});

export const getActiveLicenses = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("licenses")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
  },
});

export const getLicenseUsage = query({
  args: { licenseId: v.id("licenses") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("licenseUsage")
      .withIndex("by_license", (q) => q.eq("licenseId", args.licenseId))
      .collect();
  },
});

export const createInsight = mutation({
  args: {
    organizationId: v.id("organizations"),
    licenseId: v.optional(v.id("licenses")),
    type: v.union(
      v.literal("unused_license"),
      v.literal("duplicate_license"),
      v.literal("cost_optimization"),
      v.literal("renewal_risk"),
      v.literal("overusage")
    ),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    title: v.string(),
    description: v.string(),
    potentialSavings: v.optional(v.number()),
    confidence: v.number(),
    status: v.union(v.literal("new"), v.literal("acknowledged"), v.literal("resolved"), v.literal("dismissed")),
    metadata: v.optional(v.object({
      unusedDays: v.optional(v.number()),
      recommendedAction: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("aiInsights", args);
  },
});

// Update insight status
export const updateInsightStatus = mutation({
  args: {
    insightId: v.id("aiInsights"),
    status: v.union(v.literal("new"), v.literal("acknowledged"), v.literal("resolved"), v.literal("dismissed")),
  },
  handler: async (ctx, args) => {
    const organizationId = await getUserOrganization(ctx);
    
    const insight = await ctx.db.get(args.insightId);
    if (!insight || insight.organizationId !== organizationId) {
      throw new Error("Insight not found");
    }
    
    await ctx.db.patch(args.insightId, { status: args.status });
    return true;
  },
});

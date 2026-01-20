import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { QueryCtx, MutationCtx } from "./_generated/server";

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

// Dashboard overview query
export const getDashboardOverview = query({
  args: {},
  handler: async (ctx) => {
    const organizationId = await getUserOrganization(ctx);
    
    const licenses = await ctx.db
      .query("licenses")
      .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
      .collect();
    
    const totalLicenses = licenses.length;
    const activeLicenses = licenses.filter(l => l.status === "active").length;
    const totalCost = licenses.reduce((sum, l) => sum + l.totalCost, 0);
    const totalSeats = licenses.reduce((sum, l) => sum + l.totalSeats, 0);
    const usedSeats = licenses.reduce((sum, l) => sum + l.usedSeats, 0);
    
    // Get recent insights
    const insights = await ctx.db
      .query("aiInsights")
      .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
      .filter((q) => q.eq(q.field("status"), "new"))
      .order("desc")
      .take(5);
    
    // Get upcoming renewals (next 30 days)
    const thirtyDaysFromNow = Date.now() + (30 * 24 * 60 * 60 * 1000);
    const upcomingRenewals = licenses.filter(l => 
      l.renewalDate <= thirtyDaysFromNow && l.status === "active"
    ).length;
    
    return {
      totalLicenses,
      activeLicenses,
      totalCost,
      utilizationRate: totalSeats > 0 ? Math.round((usedSeats / totalSeats) * 100) : 0,
      upcomingRenewals,
      insights: insights.length,
      potentialSavings: insights
        .filter(i => i.potentialSavings)
        .reduce((sum, i) => sum + (i.potentialSavings || 0), 0),
    };
  },
});

// Get all licenses for organization
export const getLicenses = query({
  args: {
    category: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const organizationId = await getUserOrganization(ctx);
    
    let query = ctx.db
      .query("licenses")
      .withIndex("by_organization", (q) => q.eq("organizationId", organizationId));
    
    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }
    
    let licenses = await query.collect();
    
    if (args.category) {
      licenses = licenses.filter(l => l.category === args.category);
    }
    
    return licenses.map(license => ({
      ...license,
      utilizationRate: Math.round((license.usedSeats / license.totalSeats) * 100),
      daysUntilRenewal: Math.ceil((license.renewalDate - Date.now()) / (24 * 60 * 60 * 1000)),
    }));
  },
});

// Add new license
export const addLicense = mutation({
  args: {
    name: v.string(),
    vendor: v.string(),
    category: v.string(),
    licenseType: v.union(v.literal("per_user"), v.literal("per_device"), v.literal("enterprise")),
    totalSeats: v.number(),
    usedSeats: v.number(),
    costPerSeat: v.number(),
    billingCycle: v.union(v.literal("monthly"), v.literal("annual")),
    purchaseDate: v.number(),
    renewalDate: v.number(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const organizationId = await getUserOrganization(ctx);
    
    const licenseId = await ctx.db.insert("licenses", {
      organizationId,
      name: args.name,
      vendor: args.vendor,
      category: args.category,
      licenseType: args.licenseType,
      totalSeats: args.totalSeats,
      usedSeats: args.usedSeats,
      costPerSeat: args.costPerSeat,
      totalCost: args.totalSeats * args.costPerSeat,
      billingCycle: args.billingCycle,
      purchaseDate: args.purchaseDate,
      renewalDate: args.renewalDate,
      status: "active",
      metadata: args.description ? { description: args.description } : undefined,
    });
    
    return licenseId;
  },
});

// Update license
export const updateLicense = mutation({
  args: {
    licenseId: v.id("licenses"),
    updates: v.object({
      name: v.optional(v.string()),
      totalSeats: v.optional(v.number()),
      usedSeats: v.optional(v.number()),
      costPerSeat: v.optional(v.number()),
      renewalDate: v.optional(v.number()),
      status: v.optional(v.union(v.literal("active"), v.literal("expired"), v.literal("cancelled"))),
    }),
  },
  handler: async (ctx, args) => {
    const organizationId = await getUserOrganization(ctx);
    
    const license = await ctx.db.get(args.licenseId);
    if (!license || license.organizationId !== organizationId) {
      throw new Error("License not found");
    }
    
    const updates: any = { ...args.updates };
    if (updates.totalSeats && updates.costPerSeat) {
      updates.totalCost = updates.totalSeats * updates.costPerSeat;
    } else if (updates.totalSeats) {
      updates.totalCost = updates.totalSeats * license.costPerSeat;
    } else if (updates.costPerSeat) {
      updates.totalCost = license.totalSeats * updates.costPerSeat;
    }
    
    await ctx.db.patch(args.licenseId, updates);
    return args.licenseId;
  },
});

// Delete license
export const deleteLicense = mutation({
  args: {
    licenseId: v.id("licenses"),
  },
  handler: async (ctx, args) => {
    const organizationId = await getUserOrganization(ctx);
    
    const license = await ctx.db.get(args.licenseId);
    if (!license || license.organizationId !== organizationId) {
      throw new Error("License not found");
    }
    
    await ctx.db.delete(args.licenseId);
    return true;
  },
});

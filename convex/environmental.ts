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

// Environmental impact constants
const ENVIRONMENTAL_CONSTANTS = {
  CO2_PER_LICENSE_KG_MONTHLY: 0.15, // 150g per user per month
  ENERGY_PER_LICENSE_KWH_MONTHLY: 0.5, // 0.5 kWh per user per month
  WATER_PER_LICENSE_LITERS_MONTHLY: 2, // 2L per user per month
  CO2_PER_TREE_KG_YEARLY: 20, // 20kg CO2 per tree per year
  CO2_PER_CAR_MILE_KG: 0.404, // 0.404kg CO2 per mile
};

// Get environmental impact overview
export const getEnvironmentalOverview = query({
  args: {
    period: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const organizationId = await getUserOrganization(ctx);
    
    // Get current period if not specified
    const currentDate = new Date();
    const period = args.period || `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    
    const impact = await ctx.db
      .query("environmentalImpact")
      .withIndex("by_organization_period", (q) => 
        q.eq("organizationId", organizationId).eq("period", period)
      )
      .filter((q) => q.eq(q.field("departmentId"), undefined))
      .first();
    
    if (!impact) {
      return {
        period,
        unusedLicenses: 0,
        co2SavedKg: 0,
        energySavedKwh: 0,
        waterSavedLiters: 0,
        treeEquivalent: 0,
        carMilesEquivalent: 0,
        cumulativeCo2: 0,
        optimizationActions: 0,
      };
    }
    
    return impact;
  },
});

// Get environmental impact trend
export const getEnvironmentalTrend = query({
  args: {
    months: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const organizationId = await getUserOrganization(ctx);
    const monthsToShow = args.months || 12;
    
    const impacts = await ctx.db
      .query("environmentalImpact")
      .withIndex("by_organization_period", (q) => q.eq("organizationId", organizationId))
      .filter((q) => q.eq(q.field("departmentId"), undefined))
      .order("desc")
      .take(monthsToShow);
    
    return impacts.reverse(); // Show chronological order
  },
});

// Get department environmental rankings
export const getDepartmentEnvironmentalRankings = query({
  args: {
    period: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const organizationId = await getUserOrganization(ctx);
    
    const currentDate = new Date();
    const period = args.period || `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    
    const impacts = await ctx.db
      .query("environmentalImpact")
      .withIndex("by_organization_period", (q) => 
        q.eq("organizationId", organizationId).eq("period", period)
      )
      .filter((q) => q.neq(q.field("departmentId"), undefined))
      .collect();
    
    // Enrich with department data and sort by CO2 saved
    const rankings = await Promise.all(
      impacts.map(async (impact) => {
        const department = await ctx.db.get(impact.departmentId!);
        return {
          ...impact,
          departmentName: department?.name || "Unknown",
        };
      })
    );
    
    return rankings.sort((a, b) => b.co2SavedKg - a.co2SavedKg);
  },
});

// Calculate environmental impact
export const calculateEnvironmentalImpact = action({
  args: {
    period: v.optional(v.string()),
  },
  handler: async (ctx: ActionCtx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const userProfile = await ctx.runQuery(api.environmental.getUserProfile, { userId });
    if (!userProfile) throw new Error("User profile not found");
    
    const organizationId = userProfile.organizationId;
    
    // Get current period
    const currentDate = new Date();
    const period = args.period || `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    
    // Get all licenses and calculate unused seats
    const licenses = await ctx.runQuery(api.environmental.getOrganizationLicenses, { organizationId });
    
    let totalUnusedLicenses = 0;
    const departmentImpacts = new Map();
    
    // Calculate by department
    for (const license of licenses) {
      const unusedSeats = Math.max(0, license.totalSeats - license.usedSeats);
      totalUnusedLicenses += unusedSeats;
      
      if (license.departmentId) {
        const current = departmentImpacts.get(license.departmentId) || 0;
        departmentImpacts.set(license.departmentId, current + unusedSeats);
      }
    }
    
    // Calculate environmental metrics
    const co2SavedKg = totalUnusedLicenses * ENVIRONMENTAL_CONSTANTS.CO2_PER_LICENSE_KG_MONTHLY;
    const energySavedKwh = totalUnusedLicenses * ENVIRONMENTAL_CONSTANTS.ENERGY_PER_LICENSE_KWH_MONTHLY;
    const waterSavedLiters = totalUnusedLicenses * ENVIRONMENTAL_CONSTANTS.WATER_PER_LICENSE_LITERS_MONTHLY;
    const treeEquivalent = (co2SavedKg * 12) / ENVIRONMENTAL_CONSTANTS.CO2_PER_TREE_KG_YEARLY;
    const carMilesEquivalent = co2SavedKg / ENVIRONMENTAL_CONSTANTS.CO2_PER_CAR_MILE_KG;
    
    // Get cumulative CO2 (previous total + current month)
    const previousImpacts = await ctx.runQuery(api.environmental.getPreviousImpacts, { 
      organizationId, 
      currentPeriod: period 
    });
    const cumulativeCo2 = previousImpacts.reduce((sum, impact) => sum + impact.co2SavedKg, 0) + co2SavedKg;
    
    // Count optimization actions (resolved insights)
    const optimizationActions = await ctx.runQuery(api.environmental.getOptimizationActions, {
      organizationId,
      period,
    });
    
    // Save organization-level impact
    await ctx.runMutation(api.environmental.upsertEnvironmentalImpact, {
      organizationId,
      departmentId: undefined,
      period,
      unusedLicenses: totalUnusedLicenses,
      co2SavedKg,
      energySavedKwh,
      waterSavedLiters,
      treeEquivalent,
      carMilesEquivalent,
      cumulativeCo2,
      optimizationActions,
    });
    
    // Save department-level impacts
    for (const [departmentId, unusedSeats] of departmentImpacts) {
      const deptCo2 = unusedSeats * ENVIRONMENTAL_CONSTANTS.CO2_PER_LICENSE_KG_MONTHLY;
      const deptEnergy = unusedSeats * ENVIRONMENTAL_CONSTANTS.ENERGY_PER_LICENSE_KWH_MONTHLY;
      const deptWater = unusedSeats * ENVIRONMENTAL_CONSTANTS.WATER_PER_LICENSE_LITERS_MONTHLY;
      const deptTrees = (deptCo2 * 12) / ENVIRONMENTAL_CONSTANTS.CO2_PER_TREE_KG_YEARLY;
      const deptCarMiles = deptCo2 / ENVIRONMENTAL_CONSTANTS.CO2_PER_CAR_MILE_KG;
      
      const deptActions = await ctx.runQuery(api.environmental.getDepartmentOptimizationActions, {
        departmentId,
        period,
      });
      
      await ctx.runMutation(api.environmental.upsertEnvironmentalImpact, {
        organizationId,
        departmentId,
        period,
        unusedLicenses: unusedSeats,
        co2SavedKg: deptCo2,
        energySavedKwh: deptEnergy,
        waterSavedLiters: deptWater,
        treeEquivalent: deptTrees,
        carMilesEquivalent: deptCarMiles,
        cumulativeCo2: deptCo2, // Department cumulative would need separate calculation
        optimizationActions: deptActions,
      });
    }
    
    return {
      totalUnusedLicenses,
      co2SavedKg,
      departmentsProcessed: departmentImpacts.size,
    };
  },
});

// Helper queries
export const getUserProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});

export const getOrganizationLicenses = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("licenses")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
  },
});

export const getPreviousImpacts = query({
  args: {
    organizationId: v.id("organizations"),
    currentPeriod: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("environmentalImpact")
      .withIndex("by_organization_period", (q) => q.eq("organizationId", args.organizationId))
      .filter((q) => 
        q.and(
          q.lt(q.field("period"), args.currentPeriod),
          q.eq(q.field("departmentId"), undefined)
        )
      )
      .collect();
  },
});

export const getOptimizationActions = query({
  args: {
    organizationId: v.id("organizations"),
    period: v.string(),
  },
  handler: async (ctx, args) => {
    const insights = await ctx.db
      .query("aiInsights")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .filter((q) => q.eq(q.field("status"), "resolved"))
      .collect();
    
    // Filter by period (approximate - would need better date tracking)
    const [year, month] = args.period.split('-');
    const periodStart = new Date(parseInt(year), parseInt(month) - 1, 1).getTime();
    const periodEnd = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59).getTime();
    
    return insights.filter(insight => 
      insight._creationTime >= periodStart && insight._creationTime <= periodEnd
    ).length;
  },
});

export const getDepartmentOptimizationActions = query({
  args: {
    departmentId: v.id("departments"),
    period: v.string(),
  },
  handler: async (ctx, args) => {
    const insights = await ctx.db
      .query("aiInsights")
      .withIndex("by_department", (q) => q.eq("departmentId", args.departmentId))
      .filter((q) => q.eq(q.field("status"), "resolved"))
      .collect();
    
    // Filter by period
    const [year, month] = args.period.split('-');
    const periodStart = new Date(parseInt(year), parseInt(month) - 1, 1).getTime();
    const periodEnd = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59).getTime();
    
    return insights.filter(insight => 
      insight._creationTime >= periodStart && insight._creationTime <= periodEnd
    ).length;
  },
});

// Mutations
export const upsertEnvironmentalImpact = mutation({
  args: {
    organizationId: v.id("organizations"),
    departmentId: v.optional(v.id("departments")),
    period: v.string(),
    unusedLicenses: v.number(),
    co2SavedKg: v.number(),
    energySavedKwh: v.number(),
    waterSavedLiters: v.number(),
    treeEquivalent: v.number(),
    carMilesEquivalent: v.number(),
    cumulativeCo2: v.number(),
    optimizationActions: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("environmentalImpact")
      .withIndex("by_organization_period", (q) => 
        q.eq("organizationId", args.organizationId).eq("period", args.period)
      )
      .filter((q) => 
        args.departmentId 
          ? q.eq(q.field("departmentId"), args.departmentId)
          : q.eq(q.field("departmentId"), undefined)
      )
      .first();
    
    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    } else {
      return await ctx.db.insert("environmentalImpact", args);
    }
  },
});

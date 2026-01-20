import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Create organization
export const createOrganization = mutation({
  args: {
    name: v.string(),
    domain: v.string(),
    industry: v.optional(v.string()),
    employeeCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    // Check if organization with domain already exists
    const existingOrg = await ctx.db
      .query("organizations")
      .withIndex("by_domain", (q) => q.eq("domain", args.domain))
      .first();
    
    if (existingOrg) {
      throw new Error("Organization with this domain already exists");
    }
    
    // Create organization
    const organizationId = await ctx.db.insert("organizations", {
      name: args.name,
      domain: args.domain,
      industry: args.industry,
      employeeCount: args.employeeCount,
      settings: {
        currency: "USD",
        timezone: "UTC",
        alertThresholds: {
          unusedDays: 30,
          renewalDays: 30,
          overusagePercent: 10,
        },
      },
    });
    
    // Create user profile as admin
    await ctx.db.insert("userProfiles", {
      userId,
      organizationId,
      role: "admin",
      isActive: true,
    });
    
    // Create sample departments
    const sampleDepartments = [
      { name: "Engineering", budget: 50000 },
      { name: "Marketing", budget: 30000 },
      { name: "Sales", budget: 25000 },
      { name: "HR", budget: 15000 },
      { name: "Finance", budget: 20000 },
    ];
    
    for (const dept of sampleDepartments) {
      await ctx.db.insert("departments", {
        organizationId,
        name: dept.name,
        budget: dept.budget,
      });
    }
    
    return organizationId;
  },
});

// Get current user's organization
export const getCurrentOrganization = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    if (!userProfile) return null;
    
    const organization = await ctx.db.get(userProfile.organizationId);
    return organization ? { ...organization, userRole: userProfile.role } : null;
  },
});

// Update organization settings
export const updateOrganizationSettings = mutation({
  args: {
    settings: v.object({
      currency: v.optional(v.string()),
      timezone: v.optional(v.string()),
      alertThresholds: v.optional(v.object({
        unusedDays: v.number(),
        renewalDays: v.number(),
        overusagePercent: v.number(),
      })),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    if (!userProfile || userProfile.role !== "admin") {
      throw new Error("Admin access required");
    }
    
    const organization = await ctx.db.get(userProfile.organizationId);
    if (!organization) throw new Error("Organization not found");
    
    const updatedSettings = { ...organization.settings, ...args.settings };
    await ctx.db.patch(userProfile.organizationId, { settings: updatedSettings });
    
    return true;
  },
});

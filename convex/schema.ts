import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  organizations: defineTable({
    name: v.string(),
    domain: v.string(),
    industry: v.optional(v.string()),
    employeeCount: v.optional(v.number()),
    settings: v.object({
      currency: v.string(),
      timezone: v.string(),
      alertThresholds: v.object({
        unusedDays: v.number(),
        renewalDays: v.number(),
        overusagePercent: v.number(),
      }),
    }),
  }).index("by_domain", ["domain"]),

  userProfiles: defineTable({
    userId: v.id("users"),
    organizationId: v.id("organizations"),
    role: v.union(v.literal("admin"), v.literal("manager"), v.literal("user")),
    isActive: v.boolean(),
    department: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_organization", ["organizationId"]),

  departments: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    budget: v.number(),
    manager: v.optional(v.id("users")),
    description: v.optional(v.string()),
  }).index("by_organization", ["organizationId"]),

  licenses: defineTable({
    organizationId: v.id("organizations"),
    departmentId: v.optional(v.id("departments")),
    name: v.string(),
    vendor: v.string(),
    category: v.string(),
    licenseType: v.union(v.literal("per_user"), v.literal("per_device"), v.literal("enterprise")),
    totalSeats: v.number(),
    usedSeats: v.number(),
    costPerSeat: v.number(),
    totalCost: v.number(),
    billingCycle: v.union(v.literal("monthly"), v.literal("annual")),
    purchaseDate: v.number(),
    renewalDate: v.number(),
    status: v.union(v.literal("active"), v.literal("expired"), v.literal("cancelled")),
    metadata: v.optional(v.object({
      description: v.optional(v.string()),
    })),
  }).index("by_organization", ["organizationId"])
    .index("by_department", ["departmentId"]),

  licenseUsage: defineTable({
    licenseId: v.id("licenses"),
    userId: v.id("users"),
    lastActiveDate: v.number(),
    totalUsageHours: v.number(),
    isActive: v.boolean(),
  }).index("by_license", ["licenseId"])
    .index("by_user", ["userId"]),

  aiInsights: defineTable({
    organizationId: v.id("organizations"),
    licenseId: v.optional(v.id("licenses")),
    departmentId: v.optional(v.id("departments")),
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
  }).index("by_organization", ["organizationId"])
    .index("by_license", ["licenseId"])
    .index("by_department", ["departmentId"]),

  gamificationScores: defineTable({
    organizationId: v.id("organizations"),
    departmentId: v.id("departments"),
    period: v.string(), // "2024-01", "2024-Q1", "2024"
    periodType: v.union(v.literal("monthly"), v.literal("quarterly"), v.literal("yearly")),
    efficiencyScore: v.number(), // 0-100
    utilizationRate: v.number(), // 0-100
    budgetAdherence: v.number(), // 0-100
    totalSpend: v.number(),
    budgetAllocated: v.number(),
    licensesManaged: v.number(),
    activeLicenses: v.number(),
    potentialSavings: v.number(),
    actualSavings: v.number(),
    rank: v.optional(v.number()),
    previousRank: v.optional(v.number()),
    badges: v.array(v.string()),
  })
    .index("by_organization_period", ["organizationId", "period"])
    .index("by_department", ["departmentId"])
    .index("by_organization_type", ["organizationId", "periodType"]),

  environmentalImpact: defineTable({
    organizationId: v.id("organizations"),
    departmentId: v.optional(v.id("departments")),
    period: v.string(), // "2024-01"
    unusedLicenses: v.number(),
    co2SavedKg: v.number(), // kg of CO2 saved
    energySavedKwh: v.number(), // kWh saved
    waterSavedLiters: v.number(), // Liters saved
    treeEquivalent: v.number(), // Trees planted equivalent
    carMilesEquivalent: v.number(), // Car miles not driven
    cumulativeCo2: v.number(), // Total CO2 saved to date
    optimizationActions: v.number(), // Number of optimization actions taken
  })
    .index("by_organization_period", ["organizationId", "period"])
    .index("by_department", ["departmentId"]),

  badges: defineTable({
    organizationId: v.id("organizations"),
    departmentId: v.id("departments"),
    badgeType: v.union(
      v.literal("cost_champion"),
      v.literal("efficiency_expert"),
      v.literal("most_improved"),
      v.literal("zero_waste"),
      v.literal("green_warrior"),
      v.literal("optimization_master")
    ),
    earnedDate: v.number(),
    period: v.string(),
    criteria: v.object({
      threshold: v.number(),
      actualValue: v.number(),
      description: v.string(),
    }),
  })
    .index("by_organization", ["organizationId"])
    .index("by_department", ["departmentId"])
    .index("by_type", ["badgeType"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});

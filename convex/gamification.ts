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

// Get leaderboard for organization
export const getLeaderboard = query({
  args: {
    periodType: v.union(v.literal("monthly"), v.literal("quarterly"), v.literal("yearly")),
    period: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const organizationId = await getUserOrganization(ctx);
    
    // Get current period if not specified
    const currentDate = new Date();
    let period = args.period;
    
    if (!period) {
      if (args.periodType === "monthly") {
        period = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      } else if (args.periodType === "quarterly") {
        const quarter = Math.ceil((currentDate.getMonth() + 1) / 3);
        period = `${currentDate.getFullYear()}-Q${quarter}`;
      } else {
        period = currentDate.getFullYear().toString();
      }
    }
    
    const scores = await ctx.db
      .query("gamificationScores")
      .withIndex("by_organization_period", (q) => 
        q.eq("organizationId", organizationId).eq("period", period)
      )
      .filter((q) => q.eq(q.field("periodType"), args.periodType))
      .order("desc")
      .collect();
    
    // Sort by efficiency score and assign ranks
    const sortedScores = scores.sort((a, b) => b.efficiencyScore - a.efficiencyScore);
    
    // Enrich with department data
    const leaderboard = await Promise.all(
      sortedScores.map(async (score, index) => {
        const department = await ctx.db.get(score.departmentId);
        const rankChange = score.previousRank ? score.previousRank - (index + 1) : 0;
        
        return {
          ...score,
          rank: index + 1,
          department: department?.name || "Unknown",
          rankChange,
          medal: index === 0 ? "gold" : index === 1 ? "silver" : index === 2 ? "bronze" : null,
        };
      })
    );
    
    return leaderboard;
  },
});

// Get department performance over time
export const getDepartmentPerformance = query({
  args: {
    departmentId: v.id("departments"),
    periodType: v.union(v.literal("monthly"), v.literal("quarterly"), v.literal("yearly")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const organizationId = await getUserOrganization(ctx);
    
    const scores = await ctx.db
      .query("gamificationScores")
      .withIndex("by_department", (q) => q.eq("departmentId", args.departmentId))
      .filter((q) => q.eq(q.field("periodType"), args.periodType))
      .order("desc")
      .take(args.limit || 12);
    
    return scores.reverse(); // Show chronological order
  },
});

// Get badges for department
export const getDepartmentBadges = query({
  args: {
    departmentId: v.optional(v.id("departments")),
  },
  handler: async (ctx, args) => {
    const organizationId = await getUserOrganization(ctx);
    
    let query = ctx.db
      .query("badges")
      .withIndex("by_organization", (q) => q.eq("organizationId", organizationId));
    
    if (args.departmentId) {
      query = query.filter((q) => q.eq(q.field("departmentId"), args.departmentId));
    }
    
    const badges = await query.order("desc").collect();
    
    // Group by badge type and get latest for each
    const latestBadges = badges.reduce((acc, badge) => {
      const key = `${badge.departmentId}-${badge.badgeType}`;
      if (!acc[key] || badge.earnedDate > acc[key].earnedDate) {
        acc[key] = badge;
      }
      return acc;
    }, {} as Record<string, any>);
    
    return Object.values(latestBadges);
  },
});

// Calculate and update gamification scores
export const calculateGamificationScores = action({
  args: {
    period: v.optional(v.string()),
    periodType: v.optional(v.union(v.literal("monthly"), v.literal("quarterly"), v.literal("yearly"))),
  },
  handler: async (ctx: ActionCtx, args): Promise<number> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const userProfile: any = await ctx.runQuery(api.gamification.getUserProfile, { userId });
    if (!userProfile) throw new Error("User profile not found");
    
    const organizationId = userProfile.organizationId as any;
    
    // Get current period
    const currentDate = new Date();
    const periodType = args.periodType || "monthly";
    let period = args.period;
    
    if (!period) {
      if (periodType === "monthly") {
        period = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      } else if (periodType === "quarterly") {
        const quarter = Math.ceil((currentDate.getMonth() + 1) / 3);
        period = `${currentDate.getFullYear()}-Q${quarter}`;
      } else {
        period = currentDate.getFullYear().toString();
      }
    }
    
    // Get all departments
    const departments: any[] = await ctx.runQuery(api.gamification.getDepartments, { organizationId });
    
    const scores = [];
    
    for (const department of departments) {
      // Get department licenses and usage
      const departmentData: any = await ctx.runQuery(api.gamification.getDepartmentData, {
        departmentId: department._id,
        period,
      });
      
      // Calculate metrics
      const utilizationRate: number = departmentData.totalSeats > 0 
        ? (departmentData.usedSeats / departmentData.totalSeats) * 100 
        : 0;
      
      const budgetAdherence = department.budget > 0 
        ? Math.max(0, 100 - ((departmentData.totalSpend - department.budget) / department.budget) * 100)
        : 100;
      
      // Efficiency score: 60% utilization + 40% budget adherence
      const efficiencyScore = Math.round((utilizationRate * 0.6) + (budgetAdherence * 0.4));
      
      // Get previous score for rank comparison
      const previousScore: any = await ctx.runQuery(api.gamification.getPreviousScore, {
        departmentId: department._id,
        periodType,
      });
      
      const scoreData: any = {
        organizationId,
        departmentId: department._id,
        period,
        periodType,
        efficiencyScore,
        utilizationRate: Math.round(utilizationRate),
        budgetAdherence: Math.round(budgetAdherence),
        totalSpend: departmentData.totalSpend,
        budgetAllocated: department.budget,
        licensesManaged: departmentData.totalLicenses,
        activeLicenses: departmentData.activeLicenses,
        potentialSavings: departmentData.potentialSavings,
        actualSavings: departmentData.actualSavings,
        previousRank: previousScore?.rank,
        badges: [], // Will be calculated separately
      };
      
      scores.push(scoreData);
    }
    
    // Sort by efficiency score and assign ranks
    scores.sort((a, b) => b.efficiencyScore - a.efficiencyScore);
    scores.forEach((score, index) => {
      score.rank = index + 1;
    });
    
    // Save scores and calculate badges
    for (const score of scores) {
      await ctx.runMutation(api.gamification.upsertScore, score);
      
      // Calculate badges
      const badges = await ctx.runAction(api.gamification.calculateBadges, {
        departmentId: score.departmentId,
        score,
        period,
      });
      
      // Update score with badges
      await ctx.runMutation(api.gamification.updateScoreBadges, {
        departmentId: score.departmentId,
        period,
        badges,
      });
    }
    
    return scores.length;
  },
});

// Calculate badges for department
export const calculateBadges = action({
  args: {
    departmentId: v.id("departments"),
    score: v.any(),
    period: v.string(),
  },
  handler: async (ctx: ActionCtx, args) => {
    const badges = [];
    const { score } = args;
    
    // Cost Champion: Top efficiency score
    if (score.rank === 1) {
      badges.push("cost_champion");
      await ctx.runMutation(api.gamification.awardBadge, {
        departmentId: args.departmentId,
        badgeType: "cost_champion",
        period: args.period,
        criteria: {
          threshold: 1,
          actualValue: score.rank,
          description: "Achieved #1 efficiency ranking",
        },
      });
    }
    
    // Efficiency Expert: >95% efficiency score
    if (score.efficiencyScore >= 95) {
      badges.push("efficiency_expert");
      await ctx.runMutation(api.gamification.awardBadge, {
        departmentId: args.departmentId,
        badgeType: "efficiency_expert",
        period: args.period,
        criteria: {
          threshold: 95,
          actualValue: score.efficiencyScore,
          description: "Achieved 95%+ efficiency score",
        },
      });
    }
    
    // Most Improved: Rank improved by 3+ positions
    if (score.previousRank && score.previousRank - score.rank >= 3) {
      badges.push("most_improved");
      await ctx.runMutation(api.gamification.awardBadge, {
        departmentId: args.departmentId,
        badgeType: "most_improved",
        period: args.period,
        criteria: {
          threshold: 3,
          actualValue: score.previousRank - score.rank,
          description: `Improved ranking by ${score.previousRank - score.rank} positions`,
        },
      });
    }
    
    // Zero Waste: 100% utilization
    if (score.utilizationRate >= 100) {
      badges.push("zero_waste");
      await ctx.runMutation(api.gamification.awardBadge, {
        departmentId: args.departmentId,
        badgeType: "zero_waste",
        period: args.period,
        criteria: {
          threshold: 100,
          actualValue: score.utilizationRate,
          description: "Achieved 100% license utilization",
        },
      });
    }
    
    return badges;
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

export const getDepartments = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("departments")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();
  },
});

export const getDepartmentData = query({
  args: {
    departmentId: v.id("departments"),
    period: v.string(),
  },
  handler: async (ctx, args) => {
    const licenses = await ctx.db
      .query("licenses")
      .withIndex("by_department", (q) => q.eq("departmentId", args.departmentId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
    
    const totalLicenses = licenses.length;
    const activeLicenses = licenses.filter(l => l.usedSeats > 0).length;
    const totalSeats = licenses.reduce((sum, l) => sum + l.totalSeats, 0);
    const usedSeats = licenses.reduce((sum, l) => sum + l.usedSeats, 0);
    const totalSpend = licenses.reduce((sum, l) => sum + l.totalCost, 0);
    
    // Calculate potential savings from unused seats
    const potentialSavings = licenses.reduce((sum, l) => {
      const unusedSeats = l.totalSeats - l.usedSeats;
      return sum + (unusedSeats * l.costPerSeat * (l.billingCycle === "monthly" ? 12 : 1));
    }, 0);
    
    return {
      totalLicenses,
      activeLicenses,
      totalSeats,
      usedSeats,
      totalSpend,
      potentialSavings,
      actualSavings: 0, // Would be calculated from resolved insights
    };
  },
});

export const getPreviousScore = query({
  args: {
    departmentId: v.id("departments"),
    periodType: v.union(v.literal("monthly"), v.literal("quarterly"), v.literal("yearly")),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("gamificationScores")
      .withIndex("by_department", (q) => q.eq("departmentId", args.departmentId))
      .filter((q) => q.eq(q.field("periodType"), args.periodType))
      .order("desc")
      .first();
  },
});

// Mutations
export const upsertScore = mutation({
  args: {
    organizationId: v.id("organizations"),
    departmentId: v.id("departments"),
    period: v.string(),
    periodType: v.union(v.literal("monthly"), v.literal("quarterly"), v.literal("yearly")),
    efficiencyScore: v.number(),
    utilizationRate: v.number(),
    budgetAdherence: v.number(),
    totalSpend: v.number(),
    budgetAllocated: v.number(),
    licensesManaged: v.number(),
    activeLicenses: v.number(),
    potentialSavings: v.number(),
    actualSavings: v.number(),
    rank: v.number(),
    previousRank: v.optional(v.number()),
    badges: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("gamificationScores")
      .withIndex("by_organization_period", (q) => 
        q.eq("organizationId", args.organizationId).eq("period", args.period)
      )
      .filter((q) => 
        q.and(
          q.eq(q.field("departmentId"), args.departmentId),
          q.eq(q.field("periodType"), args.periodType)
        )
      )
      .first();
    
    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    } else {
      return await ctx.db.insert("gamificationScores", args);
    }
  },
});

export const updateScoreBadges = mutation({
  args: {
    departmentId: v.id("departments"),
    period: v.string(),
    badges: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const score = await ctx.db
      .query("gamificationScores")
      .withIndex("by_department", (q) => q.eq("departmentId", args.departmentId))
      .filter((q) => q.eq(q.field("period"), args.period))
      .first();
    
    if (score) {
      await ctx.db.patch(score._id, { badges: args.badges });
    }
  },
});

export const awardBadge = mutation({
  args: {
    departmentId: v.id("departments"),
    badgeType: v.union(
      v.literal("cost_champion"),
      v.literal("efficiency_expert"),
      v.literal("most_improved"),
      v.literal("zero_waste"),
      v.literal("green_warrior"),
      v.literal("optimization_master")
    ),
    period: v.string(),
    criteria: v.object({
      threshold: v.number(),
      actualValue: v.number(),
      description: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const department = await ctx.db.get(args.departmentId);
    if (!department) throw new Error("Department not found");
    
    return await ctx.db.insert("badges", {
      organizationId: department.organizationId,
      departmentId: args.departmentId,
      badgeType: args.badgeType,
      earnedDate: Date.now(),
      period: args.period,
      criteria: args.criteria,
    });
  },
});

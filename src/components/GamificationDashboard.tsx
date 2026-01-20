import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";

export function GamificationDashboard() {
  const [periodType, setPeriodType] = useState<"monthly" | "quarterly" | "yearly">("monthly");
  const [selectedPeriod, setSelectedPeriod] = useState("");
  
  const leaderboard = useQuery(api.gamification.getLeaderboard, {
    periodType,
    period: selectedPeriod || undefined,
  });
  
  const calculateScores = useAction(api.gamification.calculateGamificationScores);
  
  const handleCalculateScores = async () => {
    try {
      await calculateScores({ periodType });
    } catch (error) {
      console.error("Failed to calculate scores:", error);
    }
  };

  if (leaderboard === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getBadgeIcon = (badgeType: string) => {
    switch (badgeType) {
      case "cost_champion":
        return "🏆";
      case "efficiency_expert":
        return "⚡";
      case "most_improved":
        return "📈";
      case "zero_waste":
        return "♻️";
      case "green_warrior":
        return "🌱";
      case "optimization_master":
        return "🎯";
      default:
        return "🏅";
    }
  };

  const getBadgeName = (badgeType: string) => {
    switch (badgeType) {
      case "cost_champion":
        return "Cost Champion";
      case "efficiency_expert":
        return "Efficiency Expert";
      case "most_improved":
        return "Most Improved";
      case "zero_waste":
        return "Zero Waste";
      case "green_warrior":
        return "Green Warrior";
      case "optimization_master":
        return "Optimization Master";
      default:
        return "Achievement";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Department Leaderboard</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Rankings based on license efficiency and budget management
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <select
            value={periodType}
            onChange={(e) => setPeriodType(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
          
          <button
            onClick={handleCalculateScores}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
          >
            Update Rankings
          </button>
        </div>
      </div>

      {/* Top 3 Podium */}
      {leaderboard.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-4 sm:p-6 mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 text-center">
            🏆 Top Performers
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {leaderboard.slice(0, 3).map((dept, index) => (
              <div
                key={dept.departmentId}
                className={`text-center p-4 rounded-lg ${
                  index === 0 ? 'bg-yellow-200 border-2 border-yellow-400' :
                  index === 1 ? 'bg-gray-200 border-2 border-gray-400' :
                  'bg-orange-200 border-2 border-orange-400'
                }`}
              >
                <div className="text-3xl sm:text-4xl mb-2">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                </div>
                <h3 className="font-semibold text-sm sm:text-base text-gray-900">
                  {dept.department}
                </h3>
                <div className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
                  {dept.efficiencyScore}%
                </div>
                <div className="text-xs sm:text-sm text-gray-600">
                  Efficiency Score
                </div>
                {dept.badges.length > 0 && (
                  <div className="flex justify-center space-x-1 mt-2">
                    {dept.badges.slice(0, 3).map((badge, i) => (
                      <span key={i} className="text-lg" title={getBadgeName(badge)}>
                        {getBadgeIcon(badge)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Leaderboard */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            Complete Rankings
          </h2>
        </div>

        {/* Mobile View */}
        <div className="sm:hidden divide-y divide-gray-200">
          {leaderboard.map((dept) => (
            <div key={dept.departmentId} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    dept.rank <= 3 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    #{dept.rank}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{dept.department}</h3>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>Score: {dept.efficiencyScore}%</span>
                      {dept.rankChange !== 0 && (
                        <span className={`flex items-center ${
                          dept.rankChange > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {dept.rankChange > 0 ? '↗' : '↘'} {Math.abs(dept.rankChange)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {dept.badges.length > 0 && (
                  <div className="flex space-x-1">
                    {dept.badges.slice(0, 2).map((badge, i) => (
                      <span key={i} className="text-sm" title={getBadgeName(badge)}>
                        {getBadgeIcon(badge)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-500">Utilization:</span>
                  <div className="font-medium">{dept.utilizationRate}%</div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full"
                      style={{ width: `${dept.utilizationRate}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Budget:</span>
                  <div className="font-medium">{dept.budgetAdherence}%</div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div
                      className={`h-1.5 rounded-full ${
                        dept.budgetAdherence >= 90 ? 'bg-green-600' :
                        dept.budgetAdherence >= 70 ? 'bg-yellow-600' : 'bg-red-600'
                      }`}
                      style={{ width: `${dept.budgetAdherence}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Spend:</span>
                  <div className="font-medium">${dept.totalSpend.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-gray-500">Savings:</span>
                  <div className="font-medium text-green-600">
                    ${dept.potentialSavings.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Efficiency Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Budget Adherence
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Spend vs Budget
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Potential Savings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Badges
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaderboard.map((dept) => (
                <tr key={dept.departmentId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        dept.rank <= 3 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        #{dept.rank}
                      </div>
                      {dept.rankChange !== 0 && (
                        <span className={`text-xs flex items-center ${
                          dept.rankChange > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {dept.rankChange > 0 ? '↗' : '↘'} {Math.abs(dept.rankChange)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{dept.department}</div>
                    <div className="text-sm text-gray-500">
                      {dept.activeLicenses}/{dept.licensesManaged} licenses active
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-lg font-semibold text-gray-900">{dept.efficiencyScore}%</div>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${dept.efficiencyScore}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{dept.utilizationRate}%</div>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${dept.utilizationRate}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{dept.budgetAdherence}%</div>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          dept.budgetAdherence >= 90 ? 'bg-green-600' :
                          dept.budgetAdherence >= 70 ? 'bg-yellow-600' : 'bg-red-600'
                        }`}
                        style={{ width: `${dept.budgetAdherence}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      ${dept.totalSpend.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      / ${dept.budgetAllocated.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-green-600">
                      ${dept.potentialSavings.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-1">
                      {dept.badges.slice(0, 4).map((badge, i) => (
                        <span
                          key={i}
                          className="text-lg cursor-help"
                          title={getBadgeName(badge)}
                        >
                          {getBadgeIcon(badge)}
                        </span>
                      ))}
                      {dept.badges.length > 4 && (
                        <span className="text-xs text-gray-500">
                          +{dept.badges.length - 4}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {leaderboard.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No rankings available</h3>
            <p className="mt-1 text-sm text-gray-500">
              Click "Update Rankings" to calculate department performance scores.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { LicenseList } from "./LicenseList";
import { InsightsList } from "./InsightsList";
import { AddLicenseModal } from "./AddLicenseModal";
import { GamificationDashboard } from "./GamificationDashboard";
import { EnvironmentalDashboard } from "./EnvironmentalDashboard";

export function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddLicense, setShowAddLicense] = useState(false);
  
  const overview = useQuery(api.licenses.getDashboardOverview);
  const leaderboard = useQuery(api.gamification.getLeaderboard, { periodType: "monthly" });
  const environmentalOverview = useQuery(api.environmental.getEnvironmentalOverview, {});
  const generateInsights = useAction(api.aiInsights.generateUnusedLicenseInsights);

  if (overview === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handleGenerateInsights = async () => {
    try {
      await generateInsights({});
    } catch (error) {
      console.error("Failed to generate insights:", error);
    }
  };

  const topDepartment = leaderboard?.[0];
  const totalCo2Saved = environmentalOverview?.cumulativeCo2 || 0;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="ml-2 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total Licenses</p>
              <p className="text-lg sm:text-2xl font-semibold text-gray-900">{overview.totalLicenses}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <div className="ml-2 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Annual Cost</p>
              <p className="text-lg sm:text-2xl font-semibold text-gray-900">${overview.totalCost.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 sm:w-5 sm:h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div className="ml-2 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Utilization Rate</p>
              <p className="text-lg sm:text-2xl font-semibold text-gray-900">{overview.utilizationRate}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 sm:w-5 sm:h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
            </div>
            <div className="ml-2 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Potential Savings</p>
              <p className="text-lg sm:text-2xl font-semibold text-gray-900">${overview.potentialSavings.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* New Gamification Card */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-sm sm:text-lg">🏆</span>
              </div>
            </div>
            <div className="ml-2 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Top Department</p>
              <p className="text-sm sm:text-lg font-semibold text-gray-900 truncate">
                {topDepartment?.department || "N/A"}
              </p>
              {topDepartment && (
                <p className="text-xs text-orange-600">{topDepartment.efficiencyScore}% efficiency</p>
              )}
            </div>
          </div>
        </div>

        {/* New Environmental Card */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-sm sm:text-lg">🌍</span>
              </div>
            </div>
            <div className="ml-2 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600">CO₂ Saved</p>
              <p className="text-sm sm:text-lg font-semibold text-green-600">
                {totalCo2Saved.toFixed(1)} kg
              </p>
              <p className="text-xs text-green-600">Total impact</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Tab Navigation */}
      <div className="sm:hidden mb-4">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
          {[
            { id: "overview", label: "Overview" },
            { id: "licenses", label: "Licenses" },
            { id: "insights", label: `Insights (${overview.insights})` },
            { id: "leaderboard", label: "Rankings" },
            { id: "environmental", label: "Impact" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Tab Navigation and Action Buttons */}
      <div className="hidden sm:flex justify-between items-center mb-6">
        <div className="flex space-x-4">
          {[
            { id: "overview", label: "Overview" },
            { id: "licenses", label: "Licenses" },
            { id: "insights", label: `AI Insights (${overview.insights})` },
            { id: "leaderboard", label: "Department Rankings" },
            { id: "environmental", label: "Environmental Impact" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={handleGenerateInsights}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
          >
            Generate AI Insights
          </button>
          <button
            onClick={() => setShowAddLicense(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Add License
          </button>
        </div>
      </div>

      {/* Mobile Action Buttons */}
      <div className="sm:hidden mb-4">
        <div className="flex space-x-2">
          <button
            onClick={handleGenerateInsights}
            className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium text-sm"
          >
            Generate Insights
          </button>
          <button
            onClick={() => setShowAddLicense(true)}
            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
          >
            Add License
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between">
                <span className="text-sm sm:text-base text-gray-600">Active Licenses</span>
                <span className="text-sm sm:text-base font-semibold">{overview.activeLicenses}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm sm:text-base text-gray-600">Upcoming Renewals</span>
                <span className="text-sm sm:text-base font-semibold text-yellow-600">{overview.upcomingRenewals}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm sm:text-base text-gray-600">AI Insights</span>
                <span className="text-sm sm:text-base font-semibold text-purple-600">{overview.insights}</span>
              </div>
              {topDepartment && (
                <div className="flex justify-between">
                  <span className="text-sm sm:text-base text-gray-600">Top Department</span>
                  <span className="text-sm sm:text-base font-semibold text-orange-600">
                    {topDepartment.department} ({topDepartment.efficiencyScore}%)
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Cost & Environmental Impact</h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between">
                <span className="text-sm sm:text-base text-gray-600">Current Annual Spend</span>
                <span className="text-sm sm:text-base font-semibold">${overview.totalCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm sm:text-base text-gray-600">Potential Savings</span>
                <span className="text-sm sm:text-base font-semibold text-green-600">${overview.potentialSavings.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm sm:text-base text-gray-600">Optimized Spend</span>
                <span className="text-sm sm:text-base font-semibold">${(overview.totalCost - overview.potentialSavings).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm sm:text-base text-gray-600">CO₂ Saved (Total)</span>
                <span className="text-sm sm:text-base font-semibold text-green-600">{totalCo2Saved.toFixed(1)} kg</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "licenses" && <LicenseList />}
      {activeTab === "insights" && <InsightsList />}
      {activeTab === "leaderboard" && <GamificationDashboard />}
      {activeTab === "environmental" && <EnvironmentalDashboard />}

      {showAddLicense && (
        <AddLicenseModal onClose={() => setShowAddLicense(false)} />
      )}
    </div>
  );
}

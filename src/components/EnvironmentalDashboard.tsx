import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect } from "react";

export function EnvironmentalDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [animatedCo2, setAnimatedCo2] = useState(0);
  
  const overview = useQuery(api.environmental.getEnvironmentalOverview, {
    period: selectedPeriod || undefined,
  });
  
  const trend = useQuery(api.environmental.getEnvironmentalTrend, { months: 12 });
  const departmentRankings = useQuery(api.environmental.getDepartmentEnvironmentalRankings, {
    period: selectedPeriod || undefined,
  });
  
  const calculateImpact = useAction(api.environmental.calculateEnvironmentalImpact);
  
  // Animate CO2 counter
  useEffect(() => {
    if (overview?.cumulativeCo2) {
      const target = overview.cumulativeCo2;
      const duration = 2000; // 2 seconds
      const steps = 60;
      const increment = target / steps;
      let current = 0;
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          setAnimatedCo2(target);
          clearInterval(timer);
        } else {
          setAnimatedCo2(current);
        }
      }, duration / steps);
      
      return () => clearInterval(timer);
    }
  }, [overview?.cumulativeCo2]);

  const handleCalculateImpact = async () => {
    try {
      await calculateImpact({});
    } catch (error) {
      console.error("Failed to calculate environmental impact:", error);
    }
  };

  if (overview === undefined || trend === undefined || departmentRankings === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const topDepartment = departmentRankings[0];
  const totalPotentialIfAllMatched = topDepartment 
    ? (departmentRankings.reduce((sum, dept) => sum + dept.unusedLicenses, 0) - topDepartment.unusedLicenses) * 0.15
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-green-800">Environmental Impact</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Sustainability benefits from license optimization
          </p>
        </div>
        
        <button
          onClick={handleCalculateImpact}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
        >
          Update Impact
        </button>
      </div>

      {/* Cumulative CO2 Counter */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-100 rounded-lg p-6 sm:p-8 mb-6 text-center">
        <div className="flex items-center justify-center mb-4">
          <span className="text-4xl sm:text-6xl mr-3">🌍</span>
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-green-800 mb-2">
              Total CO₂ Saved
            </h2>
            <div className="text-3xl sm:text-5xl font-bold text-green-600">
              {animatedCo2.toFixed(1)} kg
            </div>
            <div className="text-sm sm:text-base text-green-700 mt-2">
              Equivalent to {overview.treeEquivalent.toFixed(1)} trees planted
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="bg-white rounded-lg p-3 sm:p-4">
            <div className="text-lg sm:text-xl">⚡</div>
            <div className="text-sm font-medium text-gray-600">Energy Saved</div>
            <div className="text-lg sm:text-xl font-bold text-green-600">
              {overview.energySavedKwh.toFixed(1)} kWh
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 sm:p-4">
            <div className="text-lg sm:text-xl">💧</div>
            <div className="text-sm font-medium text-gray-600">Water Saved</div>
            <div className="text-lg sm:text-xl font-bold text-blue-600">
              {overview.waterSavedLiters.toFixed(1)} L
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 sm:p-4">
            <div className="text-lg sm:text-xl">🚗</div>
            <div className="text-sm font-medium text-gray-600">Car Miles</div>
            <div className="text-lg sm:text-xl font-bold text-gray-600">
              {overview.carMilesEquivalent.toFixed(0)}
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 sm:p-4">
            <div className="text-lg sm:text-xl">🎯</div>
            <div className="text-sm font-medium text-gray-600">Actions</div>
            <div className="text-lg sm:text-xl font-bold text-purple-600">
              {overview.optimizationActions}
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Impact and Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Current Month Impact */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-xl mr-2">📊</span>
            This Month's Impact
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Unused Licenses</span>
              <span className="font-semibold text-gray-900">{overview.unusedLicenses}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">CO₂ Saved</span>
              <span className="font-semibold text-green-600">{overview.co2SavedKg.toFixed(1)} kg</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Energy Saved</span>
              <span className="font-semibold text-yellow-600">{overview.energySavedKwh.toFixed(1)} kWh</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Water Saved</span>
              <span className="font-semibold text-blue-600">{overview.waterSavedLiters.toFixed(1)} L</span>
            </div>
          </div>
        </div>

        {/* Trend Chart Placeholder */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-xl mr-2">📈</span>
            CO₂ Savings Trend
          </h3>
          
          <div className="h-48 flex items-end justify-between space-x-2">
            {trend.slice(-6).map((month, index) => (
              <div key={month.period} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-green-500 rounded-t"
                  style={{
                    height: `${Math.max(10, (month.co2SavedKg / Math.max(...trend.map(t => t.co2SavedKg))) * 100)}%`
                  }}
                ></div>
                <div className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-left">
                  {month.period.split('-')[1]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Department Rankings */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <span className="text-xl mr-2">🏆</span>
            Department Environmental Rankings
          </h3>
        </div>

        {departmentRankings.length > 0 && (
          <>
            {/* Top Department Highlight */}
            {topDepartment && (
              <div className="p-4 sm:p-6 bg-green-50 border-b border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-green-800">
                      🌟 Top Environmental Performer: {topDepartment.departmentName}
                    </h4>
                    <p className="text-sm text-green-700 mt-1">
                      Saved {topDepartment.co2SavedKg.toFixed(1)} kg CO₂ this month
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {topDepartment.treeEquivalent.toFixed(1)}
                    </div>
                    <div className="text-xs text-green-700">trees equivalent</div>
                  </div>
                </div>
                
                {totalPotentialIfAllMatched > 0 && (
                  <div className="mt-3 p-3 bg-green-100 rounded-lg">
                    <p className="text-sm text-green-800">
                      💡 If all departments matched this performance, we could save an additional{' '}
                      <span className="font-semibold">{totalPotentialIfAllMatched.toFixed(1)} kg CO₂</span> per month!
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Rankings List */}
            <div className="divide-y divide-gray-200">
              {departmentRankings.map((dept, index) => (
                <div key={dept.departmentId} className="p-4 sm:p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-green-100 text-green-800' :
                        index === 1 ? 'bg-emerald-100 text-emerald-800' :
                        index === 2 ? 'bg-teal-100 text-teal-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        #{index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{dept.departmentName}</h4>
                        <p className="text-sm text-gray-500">
                          {dept.unusedLicenses} unused licenses optimized
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-semibold text-green-600">
                        {dept.co2SavedKg.toFixed(1)} kg CO₂
                      </div>
                      <div className="text-sm text-gray-500">
                        {dept.treeEquivalent.toFixed(1)} trees
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Energy:</span>
                      <div className="font-medium">{dept.energySavedKwh.toFixed(1)} kWh</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Water:</span>
                      <div className="font-medium">{dept.waterSavedLiters.toFixed(1)} L</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Actions:</span>
                      <div className="font-medium">{dept.optimizationActions}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {departmentRankings.length === 0 && (
          <div className="text-center py-12">
            <span className="text-4xl mb-4 block">🌱</span>
            <h3 className="text-sm font-medium text-gray-900">No environmental data available</h3>
            <p className="mt-1 text-sm text-gray-500">
              Click "Update Impact" to calculate environmental benefits from license optimization.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

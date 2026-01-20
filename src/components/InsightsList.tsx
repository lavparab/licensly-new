import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";

export function InsightsList() {
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  const insights = useQuery(api.aiInsights.getInsights, {
    type: typeFilter || undefined,
    status: statusFilter || undefined,
  });
  
  const updateInsightStatus = useMutation(api.aiInsights.updateInsightStatus);

  if (insights === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handleStatusUpdate = async (insightId: string, status: string) => {
    try {
      await updateInsightStatus({ 
        insightId: insightId as any, 
        status: status as any 
      });
    } catch (error) {
      console.error("Failed to update insight status:", error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'unused_license':
        return (
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'cost_optimization':
        return (
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        );
      case 'renewal_risk':
        return (
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Filters */}
      <div className="p-3 sm:p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">All Types</option>
            <option value="unused_license">Unused Licenses</option>
            <option value="cost_optimization">Cost Optimization</option>
            <option value="renewal_risk">Renewal Risk</option>
            <option value="overusage">Overusage</option>
            <option value="duplicate_license">Duplicate Licenses</option>
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>
      </div>

      {/* Insights List */}
      <div className="divide-y divide-gray-200">
        {insights.map((insight) => (
          <div key={insight._id} className="p-4 sm:p-6 hover:bg-gray-50">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-2 sm:space-x-3 min-w-0 flex-1">
                <div className="flex-shrink-0 mt-0.5">
                  {getTypeIcon(insight.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 mb-2">
                    <h3 className="text-sm font-medium text-gray-900 truncate">{insight.title}</h3>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(insight.severity)}`}>
                        {insight.severity}
                      </span>
                      <span className="text-xs text-gray-500">
                        {insight.confidence}% confidence
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                  {insight.potentialSavings && (
                    <p className="text-sm font-medium text-green-600 mb-1">
                      Potential savings: ${insight.potentialSavings.toLocaleString()}
                    </p>
                  )}
                  {(insight as any).license && (
                    <p className="text-xs text-gray-500 mb-1">
                      License: {(insight as any).license.name} ({(insight as any).license.vendor})
                    </p>
                  )}
                  {insight.metadata?.recommendedAction && (
                    <p className="text-xs text-blue-600 mb-2">
                      Recommended: {insight.metadata.recommendedAction}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 ml-2">
                {insight.status === 'new' && (
                  <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2">
                    <button
                      onClick={() => handleStatusUpdate(insight._id, 'acknowledged')}
                      className="px-2 sm:px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 whitespace-nowrap"
                    >
                      Acknowledge
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(insight._id, 'dismissed')}
                      className="px-2 sm:px-3 py-1 text-xs bg-gray-100 text-gray-800 rounded-full hover:bg-gray-200 whitespace-nowrap"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
                {insight.status === 'acknowledged' && (
                  <button
                    onClick={() => handleStatusUpdate(insight._id, 'resolved')}
                    className="px-2 sm:px-3 py-1 text-xs bg-green-100 text-green-800 rounded-full hover:bg-green-200 whitespace-nowrap"
                  >
                    Mark Resolved
                  </button>
                )}
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
                  insight.status === 'new' ? 'bg-red-100 text-red-800' :
                  insight.status === 'acknowledged' ? 'bg-yellow-100 text-yellow-800' :
                  insight.status === 'resolved' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {insight.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {insights.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No insights found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {typeFilter || statusFilter ? 
              "Try adjusting your filters to see more insights." :
              "Generate AI insights to discover optimization opportunities."
            }
          </p>
        </div>
      )}
    </div>
  );
}

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";

export function LicenseList() {
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  const licenses = useQuery(api.licenses.getLicenses, {
    category: categoryFilter || undefined,
    status: statusFilter || undefined,
  });

  if (licenses === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const categories = [...new Set(licenses.map(l => l.category))];
  const statuses = [...new Set(licenses.map(l => l.status))];

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Filters */}
      <div className="p-3 sm:p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">All Statuses</option>
            {statuses.map(status => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden divide-y divide-gray-200">
        {licenses.map((license) => (
          <div key={license._id} className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-medium text-gray-900 truncate">{license.name}</h3>
                <p className="text-xs text-gray-500">{license.vendor} • {license.category}</p>
              </div>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ml-2 ${
                license.status === 'active' ? 'bg-green-100 text-green-800' :
                license.status === 'expired' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {license.status}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-500">Usage:</span>
                <div className="mt-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span>{license.usedSeats} / {license.totalSeats} seats</span>
                    <span>{license.utilizationRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${
                        license.utilizationRate > 80 ? 'bg-green-600' :
                        license.utilizationRate > 60 ? 'bg-yellow-600' : 'bg-red-600'
                      }`}
                      style={{ width: `${license.utilizationRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div>
                <span className="text-gray-500">Cost:</span>
                <div className="font-medium text-gray-900">${license.totalCost.toLocaleString()}</div>
                <div className="text-gray-500">${license.costPerSeat}/seat {license.billingCycle}</div>
              </div>
              
              <div>
                <span className="text-gray-500">Renewal:</span>
                <div className="text-gray-900">{new Date(license.renewalDate).toLocaleDateString()}</div>
                <div className={`${
                  license.daysUntilRenewal <= 30 ? 'text-red-600' :
                  license.daysUntilRenewal <= 60 ? 'text-yellow-600' : 'text-gray-500'
                }`}>
                  {license.daysUntilRenewal > 0 ? 
                    `${license.daysUntilRenewal} days` : 
                    `${Math.abs(license.daysUntilRenewal)} days overdue`
                  }
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                License
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vendor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usage
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cost
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Renewal
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {licenses.map((license) => (
              <tr key={license._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{license.name}</div>
                    <div className="text-sm text-gray-500">{license.category}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {license.vendor}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {license.usedSeats} / {license.totalSeats} seats
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className={`h-2 rounded-full ${
                        license.utilizationRate > 80 ? 'bg-green-600' :
                        license.utilizationRate > 60 ? 'bg-yellow-600' : 'bg-red-600'
                      }`}
                      style={{ width: `${license.utilizationRate}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {license.utilizationRate}% utilized
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    ${license.totalCost.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    ${license.costPerSeat}/seat {license.billingCycle}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {new Date(license.renewalDate).toLocaleDateString()}
                  </div>
                  <div className={`text-sm ${
                    license.daysUntilRenewal <= 30 ? 'text-red-600' :
                    license.daysUntilRenewal <= 60 ? 'text-yellow-600' : 'text-gray-500'
                  }`}>
                    {license.daysUntilRenewal > 0 ? 
                      `${license.daysUntilRenewal} days` : 
                      `${Math.abs(license.daysUntilRenewal)} days overdue`
                    }
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    license.status === 'active' ? 'bg-green-100 text-green-800' :
                    license.status === 'expired' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {license.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {licenses.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No licenses found</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding your first software license.</p>
        </div>
      )}
    </div>
  );
}

import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { Dashboard } from "./components/Dashboard";
import { OrganizationSetup } from "./components/OrganizationSetup";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Authenticated>
        <AuthenticatedApp />
      </Authenticated>
      <Unauthenticated>
        <UnauthenticatedApp />
      </Unauthenticated>
      <Toaster />
    </div>
  );
}

function AuthenticatedApp() {
  const organization = useQuery(api.organizations.getCurrentOrganization);

  if (organization === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!organization) {
    return <OrganizationSetup />;
  }

  return (
    <div className="min-h-screen">
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center min-w-0">
              <div className="flex-shrink-0">
                <h1 className="text-xl sm:text-2xl font-bold text-blue-600">Licensly</h1>
              </div>
              <div className="ml-3 sm:ml-6 min-w-0">
                <span className="text-xs sm:text-sm text-gray-500 truncate block max-w-32 sm:max-w-none">
                  {organization.name}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="hidden sm:block text-sm text-gray-700">AI-Powered License Management</span>
              <SignOutButton />
            </div>
          </div>
        </div>
      </header>
      <main className="pb-16 sm:pb-0">
        <Dashboard />
      </main>
    </div>
  );
}

function UnauthenticatedApp() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <h1 className="text-xl sm:text-2xl font-bold text-blue-600">Licensly</h1>
            <span className="hidden sm:block text-sm text-gray-600">AI-Powered License Management</span>
          </div>
        </div>
      </header>
      
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
              Optimize Your Software Licenses
            </h2>
            <p className="text-base sm:text-lg text-gray-600 mb-4 sm:mb-6">
              Cut IT waste, ensure compliance, and reduce costs with AI-powered insights
            </p>
            <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center mb-6 sm:mb-8">
              <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">90%</div>
                <div className="text-xs sm:text-sm text-gray-600">Detection Accuracy</div>
              </div>
              <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm">
                <div className="text-xl sm:text-2xl font-bold text-green-600">20%</div>
                <div className="text-xs sm:text-sm text-gray-600">Cost Savings</div>
              </div>
              <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm">
                <div className="text-xl sm:text-2xl font-bold text-purple-600">100%</div>
                <div className="text-xs sm:text-sm text-gray-600">Compliance</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <SignInForm />
          </div>
        </div>
      </main>
    </div>
  );
}

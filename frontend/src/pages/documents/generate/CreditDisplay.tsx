import { useState } from "react";
import { useRouter } from "next/router";
import {
  CreditCard,
  Sparkles,
  Gift,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface CreditInfo {
  total_credits_available: number;
  ai_credits_balance: number;
  bonus_ai_generation_credits: number;
  ai_credits_purchased_total: number;
}

interface CreditDisplayProps {
  creditInfo: CreditInfo | null;
  isLoading: boolean;
}

export default function CreditDisplay({
  creditInfo,
  isLoading,
}: CreditDisplayProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-neutral-900 border-2 border-primary-200 dark:border-gray-700 rounded-xl shadow-lg p-4 mb-6">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-primary-200 dark:bg-primary-700 h-12 w-12"></div>
          <div className="flex-1 space-y-2 py-2">
            <div className="h-4 bg-primary-200 dark:bg-primary-700 rounded w-3/4"></div>
            <div className="h-3 bg-primary-200 dark:bg-primary-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!creditInfo) return null;

  const hasCredits = creditInfo.total_credits_available > 0;

  return (
    <div className="bg-white dark:bg-neutral-900 border-2 border-primary-200 dark:border-gray-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 mb-6">
      {/* Compact Header - Always Visible */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`p-2 rounded-full ${
                hasCredits
                  ? "bg-gradient-to-r from-secondary-400 to-secondary-600"
                  : "bg-gradient-to-r from-red-500 to-red-600"
              }`}
            >
              {hasCredits ? (
                <Sparkles className="h-5 w-5 text-primary-300" />
              ) : (
                <AlertCircle className="h-5 w-5 text-white" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span
                  className={`text-2xl font-bold ${
                    hasCredits
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {creditInfo.total_credits_available}
                </span>
                <span className="text-lg font-semibold text-primary-600">
                  credits
                </span>
              </div>
              <p className="text-sm text-primary-500">
                {hasCredits
                  ? "Ready for AI generation"
                  : "No credits available"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!hasCredits && (
              <button
                onClick={() => router.push("/subscription")}
                className="bg-gradient-to-r from-secondary-500 to-secondary-600 hover:from-secondary-600 hover:to-secondary-700 text-primary-200 px-4 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
              >
                <CreditCard className="h-4 w-4" />
                <span>Buy Credits</span>
              </button>
            )}

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-primary-500 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all duration-200"
              aria-label={isExpanded ? "Hide details" : "Show details"}
            >
              {isExpanded ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Details */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        } overflow-hidden`}
      >
        <div className="px-4 pb-4 border-t border-primary-200 dark:border-gray-700 pt-4">
          {/* Credit Breakdown */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Purchased Credits */}
            <div className="bg-gradient-to-br from-secondary-50 to-secondary-100 dark:from-secondary-900/30 dark:to-secondary-800/30 border border-secondary-200 dark:border-gray-600 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center mb-1">
                <CreditCard className="h-4 w-4 text-secondary-600 mr-2" />
                <span className="text-sm font-semibold text-secondary-700 dark:text-secondary-300">
                  Purchased
                </span>
              </div>
              <div className="text-2xl font-bold text-secondary-600 dark:text-secondary-400">
                {creditInfo.ai_credits_balance}
              </div>
            </div>

            {/* Bonus Credits */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border border-green-200 dark:border-gray-600 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center mb-1">
                <Gift className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                  Bonus
                </span>
              </div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {creditInfo.bonus_ai_generation_credits}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-secondary-50 dark:bg-secondary-900/20 border border-secondary-200 dark:border-gray-600 rounded-lg p-3">
            <div className="text-sm text-secondary-600 dark:text-secondary-400 space-y-2">
              <div className="flex justify-between items-center">
                <span>Each generation uses:</span>
                <span className="font-semibold">1 credit</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Total purchased:</span>
                <span className="font-semibold">
                  {creditInfo.ai_credits_purchased_total}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Credits expire:</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  Never
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* No Credits Warning - Always Visible When Needed - FIXED ALIGNMENT AND BORDERS */}
      {!hasCredits && (
        <div className="mx-4 mb-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-gray-600 rounded-lg">
          <div className="flex items-start p-3">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mr-3 mt-0.5" />
            <p className="text-red-600 dark:text-red-400 text-sm leading-relaxed">
              Purchase credits to continue using AI generation.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import api from "@/utils/api";
import { debounce } from "lodash";
import { useSystemMessage } from "@/hooks/useSystemMessage";
import SystemMessage from "@/components/SystemMessage";

interface CreditPackage {
  id: number;
  name: string;
  display_name: string;
  description: string;
  credits: number;
  price: number;
  currency: string;
}

interface OrganizationCredits {
  id: number;
  ai_credits_balance: number;
  bonus_ai_generation_credits: number;
  total_credits_available: number;
  ai_credits_purchased_total: number;
}

export default function SubscriptionPage() {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [credits, setCredits] = useState<OrganizationCredits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState<number | null>(null);
  const {
    isAuthenticated,
    user,
    refreshUser,
    isLoading: authLoading,
  } = useAuth();
  const router = useRouter();

  // Fetch system message for subscription page
  const { message: systemMessage, dismissMessage } =
    useSystemMessage("subscription");

  // Check for success or canceled query parameters and refresh the user's profile
  useEffect(() => {
    const { success, canceled } = router.query;

    // If we're returning from Stripe (success or canceled is present in the URL)
    if (success === "true" || canceled === "true") {
      // Refresh the user's profile to ensure we have the latest data
      if (isAuthenticated) {
        refreshUser()
          .then(() => {
            // Also refresh credit data
            fetchCreditData();
          })
          .catch((err) => {
            // Silent error handling - could add user-facing error if needed
          });
      } else {
        // Check if we have tokens in localStorage
        const token = localStorage.getItem("token");
        const refreshToken = localStorage.getItem("refreshToken");

        if (token && refreshToken) {
          // We have tokens but the user is not authenticated in the context
          // This can happen if the page was reloaded during the redirect
          // Let's wait a moment for the auth context to initialize
          setTimeout(() => {
            refreshUser()
              .then(() => {
                fetchCreditData();
              })
              .catch((err) => {
                // Silent error handling
              });
          }, 1000);
        }
      }
    }
  }, [router.query, isAuthenticated, refreshUser]);

  // Add state for caching and request tracking
  const [isRequesting, setIsRequesting] = useState(false);
  const [cache, setCache] = useState<{
    packages: CreditPackage[] | null;
    credits: OrganizationCredits | null;
    timestamp: number;
  }>({
    packages: null,
    credits: null,
    timestamp: 0,
  });

  // Cache duration in milliseconds (1 minute)
  const CACHE_DURATION = 60000;

  // Determine if new data should be fetched
  const shouldFetchData = () => {
    const timeElapsed = Date.now() - cache.timestamp;
    return timeElapsed > CACHE_DURATION || !cache.packages || !cache.credits;
  };

  // Fetch credit data with debouncing
  const fetchCreditData = async () => {
    // If already fetching, don't fetch again
    if (isRequesting) {
      return;
    }

    try {
      setIsRequesting(true);
      setLoading(true);

      // Fetch credit packages
      const packagesResponse = await api.get("/subscriptions/packages/");
      setPackages(packagesResponse.data);

      // Fetch organization credits
      const orgResponse = await api.get("/subscriptions/organization/");
      let creditData = null;
      if (orgResponse.data && orgResponse.data.length > 0) {
        creditData = orgResponse.data[0];
        setCredits(creditData);
      }

      // Update cache with timestamp
      setCache({
        packages: packagesResponse.data,
        credits: creditData,
        timestamp: Date.now(),
      });

      setLoading(false);
    } catch (err) {
      setError("Failed to load credit information. Please try again later.");
      setLoading(false);
    } finally {
      setIsRequesting(false);
    }
  };

  // Create debounced version of fetch function
  const debouncedFetch = useRef(
    debounce(() => {
      fetchCreditData();
    }, 500)
  ).current;

  useEffect(() => {
    // Only redirect if auth state is fully loaded and user is not authenticated
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    // If still loading or authenticated, proceed with data fetching
    if (isAuthenticated) {
      // Check if cache is empty or expired
      if (shouldFetchData()) {
        debouncedFetch();
      } else {
        // Use cached data
        if (cache.packages) setPackages(cache.packages);
        if (cache.credits) setCredits(cache.credits);
        setLoading(false);
      }
    }

    // Cleanup
    return () => {
      debouncedFetch.cancel();
    };
  }, [isAuthenticated, authLoading, router, debouncedFetch]);

  // Function to refresh credit data immediately
  const refreshCreditData = async () => {
    try {
      // Refresh user profile first to get the latest data
      await refreshUser();

      // Then fetch credit data
      const packagesResponse = await api.get("/subscriptions/packages/");
      setPackages(packagesResponse.data);

      // Fetch organization credits
      const orgResponse = await api.get("/subscriptions/organization/");
      let creditData = null;
      if (orgResponse.data && orgResponse.data.length > 0) {
        creditData = orgResponse.data[0];
        setCredits(creditData);
      }

      // Update cache with timestamp
      setCache({
        packages: packagesResponse.data,
        credits: creditData,
        timestamp: Date.now(),
      });
    } catch (err) {
      // Silent error handling - function is used internally
    }
  };

  const handlePurchase = async (packageId: number) => {
    try {
      setPurchasing(packageId);
      setError(null);

      // Create checkout session for credit purchase
      const response = await api.post("/subscriptions/organization/purchase/", {
        package_id: packageId,
        success_url: `${
          window.location.origin
        }/subscription/success?t=${Date.now()}`,
        cancel_url: `${
          window.location.origin
        }/subscription/cancel?t=${Date.now()}`,
      });

      // Redirect to Stripe checkout
      if (response.data && response.data.checkout_url) {
        window.location.href = response.data.checkout_url;
      } else {
        setError(
          "Failed to initiate checkout process. Please try again later."
        );
      }
    } catch (err: any) {
      // Handle specific error cases
      if (err.response?.status === 402) {
        setError(
          "Insufficient credits. Please try purchasing a different package."
        );
      } else {
        setError(
          "Failed to initiate checkout process. Please try again later."
        );
      }
    } finally {
      setPurchasing(null);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount);
  };

  // Show success message if redirected from successful checkout
  const showSuccess = router.query.success === "true";

  // Show canceled message if redirected from canceled checkout
  const showCanceled = router.query.canceled === "true";

  return (
    <Layout title="Credits & Packages">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* System Message */}
        {systemMessage && (
          <div className="mb-6">
            <SystemMessage message={systemMessage} onClose={dismissMessage} />
          </div>
        )}

        {showSuccess && (
          <div className="bg-green-800 dark:bg-green-900 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-300 px-4 py-3 rounded mb-6">
            <p className="font-bold text-white">Success!</p>
            <p className="text-white">
              Your credits have been added successfully.
            </p>
          </div>
        )}

        {showCanceled && (
          <div className="bg-yellow-800 dark:bg-yellow-900 border border-yellow-400 dark:border-yellow-600 text-yellow-700 dark:text-yellow-300 px-4 py-3 rounded mb-6">
            <p className="font-bold text-white">Purchase Canceled</p>
            <p className="text-white">
              Your credit purchase was canceled. No charges were made.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-800 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-6">
            <p className="font-bold text-white">Error</p>
            <p className="text-white">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <>
            {/* Current Credits */}
            {credits && (
              <div className="bg-primary-100 shadow-md p-6 mb-8 border border-primary-200">
                <h2 className="text-2xl text-center font-semibold text-secondary-500 mb-4">
                  Your AI Credits
                </h2>
                <hr className="my-6 border-t border-primary-300" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                  <div className="bg-primary-200 p-4 border border-primary-200">
                    <div className="text-3xl font-bold text-secondary-500 mb-2">
                      {credits.total_credits_available}
                    </div>
                    <p className="text-primary-600 font-semibold">
                      Total Credits Available
                    </p>
                    <p className="text-sm text-primary-500  mt-1">
                      Ready to use for AI generation
                    </p>
                  </div>

                  <div className="bg-primary-200 rounded-lg p-4 border border-primary-200">
                    <div className="text-3xl font-bold text-primary-600 mb-2">
                      {credits.ai_credits_balance}
                    </div>
                    <p className="text-primary-600 dark:text-primary-400 font-semibold">
                      Purchased Credits
                    </p>
                    <p className="text-sm text-primary-500 dark:text-primary-500 mt-1">
                      Credits you've bought
                    </p>
                  </div>

                  <div className="bg-primary-200 rounded-lg p-4 border border-primary-200">
                    <div className="text-3xl font-bold text-success-400 mb-2">
                      {credits.bonus_ai_generation_credits}
                    </div>
                    <p className="text-primary-600 font-semibold">
                      Bonus Credits
                    </p>
                    <p className="text-sm text-primary-500 mt-1">
                      Free credits from admin
                    </p>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-primary-600">
                    <span className="font-semibold">
                      Total Credits Purchased:
                    </span>{" "}
                    {credits.ai_credits_purchased_total}
                  </p>
                  <p className="text-sm text-primary-500 mt-2">
                    Each AI generation uses 1 credit. Credits never expire.
                  </p>
                </div>
              </div>
            )}

            {/* Credit Packages */}
            <div>
              <h2 className="text-2xl font-semibold text-secondary-500 mb-6 text-center">
                Purchase Credit Packages
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="bg-primary-100 rounded-lg shadow-md p-6 border-2 border-transparent hover:border-secondary-400 transition-colors"
                  >
                    <div className="text-center mb-4">
                      <h3 className="inline-block bg-secondary-600 text-primary-50 px-4 py-2 rounded-full text-lg font-bold uppercase tracking-wider">
                        {pkg.display_name}
                      </h3>
                    </div>

                    <div className="text-center mb-4">
                      <div className="text-3xl font-bold text-secondary-500">
                        {pkg.credits}
                      </div>
                      <p className="text-primary-600">AI Generation Credits</p>
                    </div>

                    <div className="text-center mb-4">
                      <div className="text-2xl font-bold text-primary-600">
                        {formatCurrency(pkg.price, pkg.currency)}
                      </div>
                      <p className="text-sm text-primary-500 ">
                        ${(pkg.price / pkg.credits).toFixed(3)} per credit
                      </p>
                    </div>

                    {pkg.description && (
                      <p className="text-primary-500 mb-4 text-sm text-center">
                        {pkg.description}
                      </p>
                    )}

                    <button
                      onClick={() => handlePurchase(pkg.id)}
                      disabled={purchasing === pkg.id}
                      className="w-full bg-secondary-600 text-primary-50 px-4 py-2 hover:bg-secondary-500 transition-colors disabled:opacity-75 disabled:cursor-not-allowed"
                    >
                      {purchasing === pkg.id ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-secondary-200 mr-2"></div>
                          Processing...
                        </div>
                      ) : (
                        `Purchase ${pkg.credits} Credits`
                      )}
                    </button>
                  </div>
                ))}
              </div>

              {packages.length === 0 && !loading && (
                <div className="text-center py-8">
                  <p className="text-primary-500 dark:text-primary-500">
                    No credit packages are currently available.
                  </p>
                </div>
              )}
            </div>

            {/* Credit Usage Information */}
            <div className="mt-8 bg-secondary-100 border border-secondary-300 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-secondary-600 mb-3">
                How Credits Work
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-primary-200">
                <div>
                  <p className="mb-2 text-secondary-700">
                    • 1 Credit = 1 AI Generation
                  </p>
                  <p className="mb-2 text-secondary-700">
                    • Credits never expire
                  </p>
                  <p className="mb-2 text-secondary-700">
                    • Use bonus credits first
                  </p>
                </div>
                <div>
                  <p className="mb-2 text-secondary-700">
                    • Instant credit delivery
                  </p>
                  <p className="mb-2 text-secondary-700">
                    • No monthly subscriptions
                  </p>
                  <p className="mb-2 text-secondary-700">
                    • Pay only for what you use
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

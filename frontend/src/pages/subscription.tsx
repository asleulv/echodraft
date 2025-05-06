import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import api from "@/utils/api";
import { debounce } from "lodash";
import { useSystemMessage } from "@/hooks/useSystemMessage";
import SystemMessage from "@/components/SystemMessage";

interface SubscriptionPlan {
  id: number;
  name: string;
  display_name: string;
  description: string;
  price: number;
  currency: string;
  interval: string;
  ai_generation_limit: number;
  is_active: boolean;
}

interface OrganizationSubscription {
  id: number;
  subscription_plan: string;
  subscription_plan_display: string;
  subscription_status: string;
  subscription_period_end: string;
  ai_generations_used: number;
  ai_generation_limit: number;
  ai_generations_remaining: number;
  subscription_price: number;
  cancel_at_period_end?: boolean;
}

export default function SubscriptionPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscription, setSubscription] =
    useState<OrganizationSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, user, refreshUser, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  // Fetch system message for subscription page
  const { message: systemMessage, dismissMessage } = useSystemMessage('subscription');

  // Check for success or canceled query parameters and refresh the user's profile
  useEffect(() => {
    const { success, canceled } = router.query;

    // If we're returning from Stripe (success or canceled is present in the URL)
    if (success === "true" || canceled === "true") {
      console.log("Returning from Stripe redirect, refreshing user profile");

      // Refresh the user's profile to ensure we have the latest data
      if (isAuthenticated) {
        console.log("User is authenticated, refreshing profile");
        refreshUser()
          .then(() => {
            console.log(
              "User profile refreshed successfully after Stripe redirect"
            );
          })
          .catch((err) => {
            console.error(
              "Error refreshing user profile after Stripe redirect:",
              err
            );
          });
      } else {
        console.log(
          "User is not authenticated after Stripe redirect, checking for tokens"
        );

        // Check if we have tokens in localStorage
        const token = localStorage.getItem("token");
        const refreshToken = localStorage.getItem("refreshToken");

        if (token && refreshToken) {
          console.log(
            "Found authentication tokens, attempting to restore session"
          );

          // We have tokens but the user is not authenticated in the context
          // This can happen if the page was reloaded during the redirect
          // Let's wait a moment for the auth context to initialize
          setTimeout(() => {
            refreshUser()
              .then(() => {
                console.log(
                  "User profile restored successfully after Stripe redirect"
                );
              })
              .catch((err) => {
                console.error(
                  "Error restoring user profile after Stripe redirect:",
                  err
                );
              });
          }, 1000);
        }
      }
    }
  }, [router.query, isAuthenticated, refreshUser]);

  // Add state for caching and request tracking
  const [isRequesting, setIsRequesting] = useState(false);
  const [cache, setCache] = useState<{
    plans: SubscriptionPlan[] | null;
    subscription: OrganizationSubscription | null;
    timestamp: number;
  }>({
    plans: null,
    subscription: null,
    timestamp: 0,
  });

  // Cache duration in milliseconds (1 minute)
  const CACHE_DURATION = 60000;

  // Determine if new data should be fetched
  const shouldFetchData = () => {
    const timeElapsed = Date.now() - cache.timestamp;
    return timeElapsed > CACHE_DURATION || !cache.plans || !cache.subscription;
  };

  // Fetch subscription data with debouncing
  const fetchSubscriptionData = async () => {
    // If already fetching, don't fetch again
    if (isRequesting) {
      return;
    }

    try {
      setIsRequesting(true);
      setLoading(true);

      console.log("Fetching subscription data...");

      // Fetch subscription plans
      const plansResponse = await api.get("/subscriptions/plans/");
      setPlans(plansResponse.data);

      // Fetch organization subscription
      const orgResponse = await api.get("/subscriptions/organization/");
      let subscriptionData = null;
      if (orgResponse.data && orgResponse.data.length > 0) {
        subscriptionData = orgResponse.data[0];
        setSubscription(subscriptionData);
      }

      // Update cache with timestamp
      setCache({
        plans: plansResponse.data,
        subscription: subscriptionData,
        timestamp: Date.now(),
      });

      setLoading(false);
    } catch (err) {
      console.error("Error fetching subscription data:", err);
      setError(
        "Failed to load subscription information. Please try again later."
      );
      setLoading(false);
    } finally {
      setIsRequesting(false);
    }
  };

  // Create debounced version of fetch function
  const debouncedFetch = useRef(
    debounce(() => {
      fetchSubscriptionData();
    }, 500)
  ).current;

  useEffect(() => {
    // Only redirect if auth state is fully loaded and user is not authenticated
    if (!authLoading && !isAuthenticated) {
      console.log("User not authenticated, redirecting to login");
      router.push('/login');
      return;
    }

    // If still loading or authenticated, proceed with data fetching
    if (isAuthenticated) {
      // Check if cache is empty or expired
      if (shouldFetchData()) {
        debouncedFetch();
      } else {
        // Use cached data
        console.log("Using cached subscription data");
        if (cache.plans) setPlans(cache.plans);
        if (cache.subscription) setSubscription(cache.subscription);
      }
    }

    // Cleanup
    return () => {
      debouncedFetch.cancel();
    };
  }, [isAuthenticated, authLoading, router, debouncedFetch, shouldFetchData]);

  // Function to refresh subscription data immediately
  const refreshSubscriptionData = async () => {
    try {
      console.log("Manually refreshing subscription data...");
      
      // Refresh user profile first to get the latest data
      await refreshUser();
      
      // Then fetch subscription data
      const plansResponse = await api.get("/subscriptions/plans/");
      setPlans(plansResponse.data);

      // Fetch organization subscription
      const orgResponse = await api.get("/subscriptions/organization/");
      let subscriptionData = null;
      if (orgResponse.data && orgResponse.data.length > 0) {
        subscriptionData = orgResponse.data[0];
        setSubscription(subscriptionData);
      }

      // Update cache with timestamp
      setCache({
        plans: plansResponse.data,
        subscription: subscriptionData,
        timestamp: Date.now(),
      });

      console.log("Subscription data refreshed successfully");
    } catch (err) {
      console.error("Error refreshing subscription data:", err);
    }
  };

  const handleUpgrade = async (planId: number) => {
    try {
      // Store authentication state in localStorage before redirecting
      const authState = {
        timestamp: Date.now(),
        planId: planId,
      };
      localStorage.setItem(
        "subscription_upgrade_state",
        JSON.stringify(authState)
      );

      console.log(
        "Storing subscription upgrade state before redirect:",
        authState
      );

      // Create checkout session with dedicated success/cancel pages
      const response = await api.post("/subscriptions/checkout/", {
        plan_id: planId,
        // Use dedicated pages instead of query parameters
        success_url: `${
          window.location.origin
        }/subscription/success?t=${Date.now()}`,
        cancel_url: `${
          window.location.origin
        }/subscription/cancel?t=${Date.now()}`,
      });

      // Check if this is a downgrade (moving to a cheaper plan)
      const selectedPlan = plans.find(p => p.id === planId);
      const currentPlan = plans.find(p => p.name === subscription?.subscription_plan);
      const isDowngrade = selectedPlan && currentPlan && selectedPlan.price < currentPlan.price;
      const isPaidToPaidDowngrade = isDowngrade && selectedPlan?.price > 0 && currentPlan?.price > 0;
      
      // If the API returns an error about paid-to-paid downgrade
      if (response.data && response.data.error && response.data.requires_cancellation) {
        console.log("Paid-to-paid downgrade not allowed:", response.data.error);
        
        // Show the error message to the user
        setError(response.data.error);
        
        // You could also show a modal here with more detailed instructions
        // For now, we'll just show the error message
        return;
      }
      // For any downgrade (free plan or between paid plans), refresh the data immediately
      else if (isDowngrade) {
        console.log(`Downgrading from ${currentPlan?.display_name} to ${selectedPlan?.display_name}, refreshing data immediately`);
        console.log("Full response data:", JSON.stringify(response.data));
        
        // Always refresh data for downgrades, regardless of response format
        // This ensures we handle both old and new API response formats
        setError(null); // Clear any previous errors
        
        // Add a small delay to ensure the backend has time to process the changes
        setTimeout(async () => {
          console.log("Refreshing subscription data after downgrade...");
          await refreshSubscriptionData();
          
          // Force a page reload to ensure all components are updated
          window.location.reload();
        }, 1000);
      } 
      // For paid plans, redirect to Stripe checkout
      else if (response.data && response.data.checkout_url) {
        console.log("Redirecting to Stripe checkout:", response.data.checkout_url);
        // Force a redirect to the checkout URL
        setTimeout(() => {
          window.location.href = response.data.checkout_url;
        }, 100);
      } 
      // For success responses without a checkout URL (like downgrades that were processed differently)
      else if (response.data && response.data.success) {
        console.log("Operation successful:", response.data.message);
        setError(null); // Clear any previous errors
        
        // If there's a redirect URL, use it
        if (response.data.redirect_url) {
          window.location.href = response.data.redirect_url;
        } else {
          // Otherwise, just reload the page to show the updated subscription
          window.location.reload();
        }
      }
      // Only show an error if we don't have a success response or checkout URL
      else {
        console.error("No checkout URL or success response returned from the server:", response.data);
        setError("Failed to process subscription change. Please try again later.");
      }
    } catch (err) {
      console.error("Error creating checkout session:", err);
      setError("Failed to initiate checkout process. Please try again later.");
    }
  };

  const handleManageSubscription = async () => {
    try {
      // Store authentication state in localStorage before redirecting
      const authState = {
        timestamp: Date.now(),
        action: "manage",
      };
      localStorage.setItem(
        "subscription_manage_state",
        JSON.stringify(authState)
      );

      console.log(
        "Storing subscription management state before redirect:",
        authState
      );

      // Create customer portal session with dedicated success page
      const response = await api.post("/subscriptions/portal/", {
        // Use dedicated success page for better session handling
        return_url: `${
          window.location.origin
        }/subscription/success?t=${Date.now()}`,
      });

      // Redirect to Stripe customer portal
      if (response.data && response.data.portal_url) {
        window.location.href = response.data.portal_url;
      }
    } catch (err) {
      console.error("Error creating portal session:", err);
      setError(
        "Failed to access subscription management portal. Please try again later."
      );
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Show success message if redirected from successful checkout
  const showSuccess = router.query.success === "true";

  // Show canceled message if redirected from canceled checkout
  const showCanceled = router.query.canceled === "true";

  return (
    <Layout title="Subscription">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* System Message */}
        {systemMessage && (
          <div className="mb-6">
            <SystemMessage 
              message={systemMessage} 
              onClose={dismissMessage}
            />
          </div>
        )}

        {showSuccess && (
          <div className="bg-green-800 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            <p className="font-bold text-white">Success!</p>
            <p className="text-white">Your subscription has been updated successfully.</p>
          </div>
        )}

        {showCanceled && (
          <div className="bg-yellow-800 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
            <p className="font-bold text-white">Checkout Canceled</p>
            <p className="text-white">
              Your subscription checkout was canceled. No changes were made to
              your subscription.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-800 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
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
            {/* Downgrade Notice */}
            {subscription && subscription.cancel_at_period_end && 
              // Only show for actual downgrades (not for upgrades where cancel_at_period_end wasn't reset)
              (subscription.subscription_plan === 'explorer' || 
               (plans.find(p => p.name === subscription.subscription_plan)?.price ?? 0) < 
               Math.max(...plans.filter(p => p.name !== subscription.subscription_plan).map(p => p.price || 0), 0)) && (
              <div className="bg-danger-500 border border-danger-100 text-blue-700 px-6 py-4 rounded mb-6">
                <div className="flex items-start">
  
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-primary-200">Subscription Change Pending</h3>
                    <div className="mt-2">
                      <p className="text-primary-200">
                        You've successfully downgraded your subscription. Your current paid plan 
                        will remain active until {formatDate(subscription.subscription_period_end)}.
                      </p>
                      <p className="mt-2 text-primary-200">
                        After this date, you'll be automatically switched to your new plan and won't be charged again.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Current Subscription */}
            {subscription && (
              <div className="bg-primary-100 rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-2xl text-center font-semibold text-secondary-500 mb-4">
                  Current Subscription
                </h2>
                <hr className="my-6 border-t border-primary-300" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-primary-600 mb-2">
                      
                      <span className="font-semibold">Subscription:</span>{" "}
                      <span className="text-primary-600">
                        {subscription.subscription_plan_display}
                      </span>
                    </p>
                    <p className="text-primary-600 mb-2">
                      <span className="font-semibold">Status:</span>{" "}
                      {subscription.subscription_status}
                      {subscription.cancel_at_period_end && subscription.subscription_period_end && (
                        <span className="text-red-600 ml-2">
                          (expiring {new Date(subscription.subscription_period_end).toLocaleDateString()})
                        </span>
                      )}
                    </p>
                    {subscription.subscription_period_end && (
                      <p className="text-primary-600 mb-2">
                        <span className="font-semibold">Renewal Date:</span>{" "}
                        {formatDate(subscription.subscription_period_end)}
                      </p>
                    )}
                    <p className="text-primary-600 mb-2">
                      <span className="font-semibold">Price:</span>{" "}
                      {formatCurrency(subscription.subscription_price, "USD")}
                      /month
                    </p>
                  </div>
                  <div>
                    <p className="text-primary-600 mb-2">
                      <span className="font-semibold">
                        AI Generation Limit:
                      </span>{" "}
                      {subscription.ai_generation_limit} per month
                    </p>
                    <p className="text-primary-600 mb-2">
                      <span className="font-semibold">
                        AI Generations Used:
                      </span>{" "}
                      {subscription.ai_generations_used}
                    </p>
                    <p className="text-primary-600 mb-2">
                      <span className="font-semibold">
                        AI Generations Remaining:
                      </span>{" "}
                      {subscription.ai_generations_remaining}
                    </p>

                    {subscription.subscription_plan !== "explorer" && (
                      <button
                        onClick={handleManageSubscription}
                        className="mt-4 bg-primary-500 text-primary-200 px-4 py-2 rounded hover:bg-primary-700 transition-colors"
                      >
                        Manage Subscription
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Subscription Plans */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Add debugging to see what's happening */}
              {(() => {
                console.log("Current subscription:", subscription);
                console.log("All plans:", plans);
                return null;
              })()}
              
              {plans
                .filter(plan => {
                  // If no subscription, show all plans
                  if (!subscription) {
                    console.log(`Showing plan ${plan.name} (no subscription)`);
                    return true;
                  }
                  
                  // Get the current plan
                  const currentPlan = plans.find(p => p.name === subscription.subscription_plan);
                  console.log(`Current plan: ${currentPlan?.name}, price: ${currentPlan?.price}`);
                  
                  if (!currentPlan) {
                    console.log(`Showing plan ${plan.name} (current plan not found)`);
                    return true;
                  }
                  
                  // Always show the free plan (Explorer)
                  if (plan.name === 'explorer') {
                    console.log(`Showing free plan ${plan.name}`);
                    return true;
                  }
                  
                  // If current plan is free, show all paid plans
                  if (currentPlan.price === 0) {
                    console.log(`Showing paid plan ${plan.name} (current plan is free)`);
                    return true;
                  }
                  
                  // If this is the current plan, show it
                  if (plan.name === subscription.subscription_plan) {
                    console.log(`Showing current plan ${plan.name}`);
                    return true;
                  }
                  
                  // Hide lower-tier paid plans (only show upgrades)
                  // Ensure that downgrading to a lower-tier paid plan (e.g., Master -> Creator) is not allowed
                  const planHierarchy = ["explorer", "creator", "master"]; // Order of the plans (lowest to highest)
                  
                  if (planHierarchy.indexOf(plan.name) < planHierarchy.indexOf(currentPlan.name)) {
                    console.log(`Hiding lower-tier paid plan ${plan.name} (${plan.name} < ${currentPlan.name})`);
                    return false;
                  }
                  
                  // Show higher-tier plans (upgrades)
                  console.log(`Showing higher-tier plan ${plan.name}`);
                  return true;
                })
                .map((plan) => (
                <div
                  key={plan.id}
                  className={`bg-primary-100 rounded-lg shadow-md p-6 border-2 ${
                    subscription && subscription.subscription_plan === plan.name
                      ? "border-secondary-400"
                      : "border-transparent"
                  }`}
                >
                  <h3 className="text-xl font-bold mb-2">
                    <span
                      className={`
                                ${plan.display_name === "Explorer" ? "text-primary-500" : ""}
                                ${plan.display_name === "Master" ? "text-secondary-600" : ""}
                                ${plan.display_name === "Creator" ? "text-primary-900" : ""}
                                text-primary-600
                              `}
                    >
                      {plan.display_name}
                    </span>
                  </h3>
                  <p className="text-2xl font-bold text-primary-600 mb-4">
                    {plan.price === 0
                      ? "Free"
                      : `${formatCurrency(plan.price, plan.currency)}/${
                          plan.interval
                        }`}
                  </p>
                  <p className="text-primary-500 mb-4">{plan.description}</p>
                  <ul className="mb-6 space-y-2">
                    <li className="flex items-start">
                      <svg
                        className="h-5 w-5 text-secondary-500 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-primary-700">
                        {plan.ai_generation_limit} AI generations per month
                      </span>
                    </li>
                    <li className="flex items-start">
                      <svg
                        className="h-5 w-5 text-secondary-500 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-primary-700">
                        Unlimited document storage
                      </span>
                    </li>
                    <li className="flex items-start">
                      <svg
                        className="h-5 w-5 text-secondary-500 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-primary-700">
                        Full access to all features
                      </span>
                    </li>
                  </ul>

                  {subscription &&
                  subscription.subscription_plan === plan.name ? (
                    <button
                      disabled
                      className="w-full bg-primary-600 text-white px-4 py-2 rounded opacity-75 cursor-not-allowed"
                    >
                      Current Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(plan.id)}
                      className="w-full bg-secondary-600 text-primary-50 px-4 py-2 rounded hover:bg-secondary-500 transition-colors"
                    >
                      {plan.price === 0 ? "Downgrade" : "Switch"} to{" "}
                      {plan.display_name}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

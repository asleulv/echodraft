import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export interface CreditInfo {
  total_credits_available: number;
  ai_credits_balance: number;
  bonus_ai_generation_credits: number;
  ai_credits_purchased_total: number;
}

export function useCreditInfo() {
  const [creditInfo, setCreditInfo] = useState<CreditInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  const fetchCreditInfo = async () => {
    try {
      setIsLoading(true);
      const { default: api } = await import("@/utils/api");
      const response = await api.get("/subscriptions/organization/");
      if (response.data && response.data.length > 0) {
        setCreditInfo(response.data[0]);
      }
    } catch (err) {
      console.error("Failed to fetch credit info:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshCreditInfo = async () => {
    await fetchCreditInfo();
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchCreditInfo();
    }
  }, [isAuthenticated]);

  const hasCredits = creditInfo ? creditInfo.total_credits_available > 0 : false;

  return {
    creditInfo,
    isLoading,
    hasCredits,
    refreshCreditInfo,
  };
}

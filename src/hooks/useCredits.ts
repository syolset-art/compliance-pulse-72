/**
 * @deprecated Credits have been replaced with plan-based pricing.
 * This hook is kept as a no-op shim so existing components keep working
 * during the transition. All values indicate "unlimited" (included in plan).
 */
export function useCredits() {
  const noopAsync = async (_amount: number, _description: string) => 9999;
  const noopPurchase = async (_packageId: string) => 9999;

  return {
    balance: 9999,
    monthlyAllowance: 9999,
    percentUsed: 0,
    percentRemaining: 100,
    isLow: false,
    isExhausted: false,
    isUnlimited: true,
    isLoading: false,
    recentTransactions: [] as Array<{
      id: string;
      amount: number;
      transaction_type: string;
      description: string | null;
      created_at: string;
      balance_after: number;
    }>,
    deductCredits: noopAsync,
    isDeducting: false,
    purchaseCredits: noopPurchase,
    isPurchasing: false,
  };
}

import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/hooks/useSubscription";
import { Crown, Zap, Wallet } from "lucide-react";

export function SubscriptionPill() {
  const { subscription, balance, loading } = useSubscription();

  if (loading) {
    return (
      <Badge variant="secondary" className="animate-pulse">
        Loading...
      </Badge>
    );
  }

  if (!subscription) {
    return (
      <Badge variant="outline" className="bg-muted/50 text-muted-foreground">
        No Plan
      </Badge>
    );
  }

  const planName = subscription.subscription_plans.name;
  const isOnTrial = subscription.trial_end && new Date(subscription.trial_end) > new Date();

  if (planName === "Free") {
    const balanceAmount = balance?.current_balance || 0;
    const isLowBalance = balanceAmount < 10;
    
    return (
      <Badge variant="secondary" className={`${isLowBalance ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800' : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'}`}>
        <Zap className="w-3 h-3 mr-1" />
        Pay as You Go
        {balance && (
          <span className="ml-2 flex items-center gap-1">
            <Wallet className="w-3 h-3" />
            ${balanceAmount.toFixed(2)}
          </span>
        )}
      </Badge>
    );
  }

  if (planName === "Pro") {
    return (
      <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0">
        <Crown className="w-3 h-3 mr-1" />
        {isOnTrial ? "Pro Trial" : "Pro"}
      </Badge>
    );
  }

  return (
    <Badge variant="outline">
      {planName}
    </Badge>
  );
}
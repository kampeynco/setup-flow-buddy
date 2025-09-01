import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionPlan {
  id: number;
  name: string;
  monthly_fee: number;
  per_mailing_fee: number;
  stripe_price_id?: string;
}

interface UserSubscription {
  id: string;
  profile_id: string;
  plan_id: number;
  status: string;
  current_period_start: string;
  current_period_end: string | null;
  trial_end: string | null;
  trial_used: boolean;
  stripe_customer_id?: string;
  subscription_plans: SubscriptionPlan;
}

interface AccountBalance {
  current_balance: number;
  auto_topup_enabled: boolean;
  last_topup_at?: string;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [balance, setBalance] = useState<AccountBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    async function fetchSubscriptionData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (isMounted) {
            setLoading(false);
          }
          return;
        }

        // Fetch subscription data
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from('user_subscriptions')
          .select(`
            *,
            subscription_plans (
              id,
              name,
              monthly_fee,
              per_mailing_fee,
              stripe_price_id
            )
          `)
          .eq('profile_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        if (subscriptionError && subscriptionError.code !== "PGRST116") {
          throw subscriptionError;
        }

        // Fetch account balance if user has Pay as You Go plan
        let balanceData = null;
        if (subscriptionData?.subscription_plans?.name === "Free") {
          const { data: balance, error: balanceError } = await supabase
            .from("account_balances")
            .select("current_balance, auto_topup_enabled, last_topup_at")
            .eq("profile_id", user.id)
            .maybeSingle();

          if (balanceError && balanceError.code !== "PGRST116") {
            throw balanceError;
          }
          
          balanceData = balance;
        }

        if (isMounted) {
          setSubscription(subscriptionData);
          setBalance(balanceData);
        }
      } catch (err) {
        console.error('Error fetching subscription data:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchSubscriptionData();

    // Set up real-time listeners
    const subscriptionChannel = supabase
      .channel('user_subscriptions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_subscriptions'
        },
        () => {
          fetchSubscriptionData();
        }
      )
      .subscribe();

    const balanceChannel = supabase
      .channel('account_balances_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'account_balances'
        },
        () => {
          fetchSubscriptionData();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(subscriptionChannel);
      supabase.removeChannel(balanceChannel);
    };
  }, []);

  return { subscription, balance, loading, error };
}
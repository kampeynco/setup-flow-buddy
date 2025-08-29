import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionPlan {
  id: number;
  name: string;
  monthly_fee: number;
  per_mailing_fee: number;
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
  subscription_plans: SubscriptionPlan;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('user_subscriptions')
          .select(`
            *,
            subscription_plans (
              id,
              name,
              monthly_fee,
              per_mailing_fee
            )
          `)
          .eq('profile_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        if (error) {
          throw error;
        }

        setSubscription(data);
      } catch (err) {
        console.error('Error fetching subscription:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchSubscription();

    // Set up real-time subscription to detect changes
    const channel = supabase
      .channel('user_subscriptions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_subscriptions'
        },
        () => {
          fetchSubscription();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { subscription, loading, error };
}
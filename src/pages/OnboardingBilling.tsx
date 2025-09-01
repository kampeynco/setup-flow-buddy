import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { OnboardingLayout } from "./OnboardingLayout";
import { Check, CreditCard, Zap } from "lucide-react";

interface SubscriptionPlan {
  id: number;
  name: string;
  monthly_fee: number;
  per_mailing_fee: number;
  stripe_price_id: string;
}

export default function OnboardingBilling() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>("free");
  const [loadingPlans, setLoadingPlans] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate("/auth");
          return;
        }

        // Check onboarding progress
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed, onboarding_step')
          .eq('id', user.id)
          .single();

        if (profile) {
          if (profile.onboarding_completed) {
            navigate("/dashboard");
            return;
          }
          if (profile.onboarding_step < 3) {
            navigate("/onboarding/step-2");
            return;
          }
        }

        // Load subscription plans
        const { data: subscriptionPlans } = await supabase
          .from('subscription_plans')
          .select('*')
          .order('monthly_fee', { ascending: true });

        if (subscriptionPlans) {
          setPlans(subscriptionPlans);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoadingPlans(false);
      }
    };

    loadData();
  }, [navigate]);

  const handlePlanSelect = (planType: string) => {
    setSelectedPlan(planType);
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      if (selectedPlan === "pro") {
        // Create Stripe checkout session
        const { data, error } = await supabase.functions.invoke('create-checkout-session', {
          body: { plan_type: 'pro' }
        });

        if (error) {
          toast.error("Failed to create checkout session");
          return;
        }

        if (data?.url) {
          // Open Stripe checkout in new tab
          window.open(data.url, '_blank');
          
          // Mark onboarding as completed and redirect
          await supabase
            .from('profiles')
            .update({ 
              onboarding_completed: true,
              onboarding_step: 4 
            })
            .eq('id', user.id);

          toast.success("Redirecting to Stripe checkout...");
          setTimeout(() => navigate("/dashboard"), 2000);
        }
      } else {
        // Free plan - just complete onboarding
        const { error } = await supabase
          .from('profiles')
          .update({ 
            onboarding_completed: true,
            onboarding_step: 4 
          })
          .eq('id', user.id);

        if (error) {
          toast.error("Failed to complete setup");
          return;
        }

        toast.success("Setup completed! Welcome to Thank Donors!");
        navigate("/dashboard");
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error("Failed to complete setup");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/onboarding/step-2");
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ 
          onboarding_completed: true,
          onboarding_step: 4 
        })
        .eq('id', user.id);

      if (error) {
        toast.error("Failed to complete setup");
        return;
      }

      toast.success("Setup completed! You can upgrade anytime from your dashboard.");
      navigate("/dashboard");
    } catch (error) {
      console.error('Error skipping billing:', error);
      toast.error("Failed to complete setup");
    } finally {
      setLoading(false);
    }
  };

  if (loadingPlans) {
    return (
      <OnboardingLayout
        currentStep={4}
        totalSteps={4}
        title="Billing Setup"
        description="Choose your plan to get started"
        onBack={handleBack}
      >
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading plans...</p>
        </div>
      </OnboardingLayout>
    );
  }

  return (
    <OnboardingLayout
      currentStep={4}
      totalSteps={4}
      title="Billing Setup"
      description="Choose your plan to get started with Thank Donors"
      onBack={handleBack}
    >
      <div className="space-y-6">
        {/* Plan Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free Plan */}
          <Card 
            className={`cursor-pointer transition-all ${
              selectedPlan === "free" 
                ? "ring-2 ring-primary border-primary" 
                : "hover:border-primary/50"
            }`}
            onClick={() => handlePlanSelect("free")}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Pay-as-you-go
                </CardTitle>
                <Badge variant="secondary">Free to Start</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-2xl font-bold">$0<span className="text-sm font-normal text-muted-foreground">/month</span></div>
                  <div className="text-sm text-muted-foreground">$0.75 per postcard sent</div>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    No monthly commitment
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Pay only for what you use
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Perfect for small campaigns
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card 
            className={`cursor-pointer transition-all ${
              selectedPlan === "pro" 
                ? "ring-2 ring-primary border-primary" 
                : "hover:border-primary/50"
            }`}
            onClick={() => handlePlanSelect("pro")}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Pro Plan
                </CardTitle>
                <Badge>Most Popular</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-2xl font-bold">$39<span className="text-sm font-normal text-muted-foreground">/month</span></div>
                  <div className="text-sm text-muted-foreground">$0.65 per postcard sent</div>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Lower per-postcard cost
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Priority support
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Advanced analytics
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Best for active campaigns
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-6">
          <Button 
            variant="outline"
            onClick={handleSkip}
            disabled={loading}
          >
            Skip for Now
          </Button>
          <Button 
            onClick={handleComplete}
            disabled={loading}
            className="min-w-32"
          >
            {loading 
              ? "Processing..." 
              : selectedPlan === "pro" 
                ? "Start Pro Plan" 
                : "Start Free Plan"
            }
          </Button>
        </div>

        {/* Note */}
        <div className="text-center text-sm text-muted-foreground">
          <p>You can change your plan anytime from your dashboard.</p>
          {selectedPlan === "pro" && (
            <p className="mt-1">You'll be redirected to Stripe to complete your subscription.</p>
          )}
        </div>
      </div>
    </OnboardingLayout>
  );
}
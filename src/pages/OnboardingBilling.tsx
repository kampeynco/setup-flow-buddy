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
        // Create Stripe checkout session for Pro plan
        const { data, error } = await supabase.functions.invoke('create-checkout-session', {
          body: { planId: 2 } // Pro plan ID
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
        // Free plan - set up pay as you go with billing
        const { data, error } = await supabase.functions.invoke('create-checkout-session', {
          body: { planId: 1 } // Free/Pay as you go plan ID
        });

        if (error) {
          toast.error("Failed to create checkout session");
          return;
        }

        if (data?.redirect_url) {
          // For free plan, redirect directly to payment setup
          window.location.href = data.redirect_url;
        } else if (data?.url) {
          // Fallback: open in new tab
          window.open(data.url, '_blank');
          
          // Mark onboarding as completed and redirect
          await supabase
            .from('profiles')
            .update({ 
              onboarding_completed: true,
              onboarding_step: 4 
            })
            .eq('id', user.id);

          toast.success("Setting up your Pay as You Go account...");
          setTimeout(() => navigate("/dashboard"), 2000);
        }
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
                  Pay as You Go
                </CardTitle>
                <Badge variant="secondary">$0/month</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-2xl font-bold">$0<span className="text-sm font-normal text-muted-foreground">/month</span></div>
                  <div className="text-sm text-muted-foreground">$1.99 per postcard sent</div>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Standard class mail (7-10 days)
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    6x9 postcards
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Basic branding options
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Email support
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card 
            className={`cursor-pointer transition-all relative border-primary bg-primary/5 ${
              selectedPlan === "pro" 
                ? "ring-2 ring-primary border-primary" 
                : "hover:border-primary/50"
            }`}
            onClick={() => handlePlanSelect("pro")}
          >
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                Most Popular
              </span>
            </div>
            <CardHeader className="pt-6">
              <div className="flex items-center justify-center">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Pro Plan
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-2xl font-bold">$99<span className="text-sm font-normal text-muted-foreground">/month</span></div>
                  <div className="text-sm text-muted-foreground">$0.99 per postcard (50% savings)</div>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    First class mail (3-5 days)
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    6x9 postcards
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Custom branding options
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Email and Phone support
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Remove Thank Donors branding
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
                ? "Start 7-Day Pro Trial" 
                : "Get Started"
            }
          </Button>
        </div>

        {/* Note */}
        <div className="text-center text-sm text-muted-foreground">
          <p>No setup fees, cancel anytime</p>
          {selectedPlan === "pro" && (
            <p className="mt-1">You'll be redirected to Stripe to complete your 7-day trial.</p>
          )}
        </div>
      </div>
    </OnboardingLayout>
  );
}
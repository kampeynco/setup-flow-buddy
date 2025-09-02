import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, CreditCard, Zap, Crown } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

interface SubscriptionPlan {
  id: number;
  name: string;
  monthly_fee: number;
  per_mailing_fee: number;
  stripe_price_id: string;
}

interface ManagePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManagePlanDialog({ open, onOpenChange }: ManagePlanDialogProps) {
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>("free");
  const [loadingPlans, setLoadingPlans] = useState(true);
  const { subscription, loading: subscriptionLoading } = useSubscription();

  const currentPlan = subscription?.subscription_plans?.name || "Free";
  const isCurrentPro = currentPlan === "Pro";
  const isOnTrial = subscription?.trial_end && new Date(subscription.trial_end) > new Date();
  const hasRealStripeCustomer = subscription?.stripe_customer_id && subscription.stripe_customer_id !== "temp_customer_id";

  useEffect(() => {
    if (open) {
      loadPlans();
    }
  }, [open]);

  const loadPlans = async () => {
    try {
      setLoadingPlans(true);
      const { data: subscriptionPlans } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('monthly_fee', { ascending: true });

      if (subscriptionPlans) {
        setPlans(subscriptionPlans);
      }
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoadingPlans(false);
    }
  };

  const handlePlanSelect = (planType: string) => {
    setSelectedPlan(planType);
  };

  const handleSubscribe = async (planType?: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to continue");
        return;
      }

      const targetPlan = planType || selectedPlan;

      if (targetPlan === "pro") {
        const { data, error } = await supabase.functions.invoke('create-checkout-session', {
          body: { 
            planId: 2, // Pro plan ID
            cancelUrl: window.location.href
          }
        });

        if (error) {
          toast.error("Failed to create checkout session");
          return;
        }

        if (data?.url) {
          window.open(data.url, '_blank');
          toast.success("Redirecting to Stripe checkout...");
        }
      } else {
        // Pay as you go
        const { data, error } = await supabase.functions.invoke('create-checkout-session', {
          body: { 
            planId: 1, // Free/Pay as you go plan ID
            cancelUrl: window.location.href
          }
        });

        if (error) {
          toast.error("Failed to create checkout session");
          return;
        }

        if (data?.url) {
          window.open(data.url, '_blank');
          toast.success("Setting up your Pay as You Go account...");
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to process request");
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) {
        toast.error("Failed to open customer portal");
        return;
      }

      if (data?.url) {
        window.open(data.url, '_blank');
        toast.success("Opening billing portal...");
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error("Failed to open billing portal");
    } finally {
      setLoading(false);
    }
  };

  if (loadingPlans || subscriptionLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Manage Your Plan</DialogTitle>
            <DialogDescription>
              Update your subscription or billing information
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading plans...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Manage Your Plan</DialogTitle>
          <DialogDescription>
            {currentPlan === "Free" ? "Upgrade your plan or manage billing" : "Manage your subscription and billing"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Plan Status */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Current Plan</h3>
                <div className="flex items-center gap-2 mt-1">
                  {isCurrentPro ? (
                    <Crown className="h-4 w-4 text-purple-500" />
                  ) : (
                    <Zap className="h-4 w-4 text-yellow-500" />
                  )}
                  <span className="font-semibold">
                    {isCurrentPro ? "Pro" : "Pay as You Go"}
                    {isOnTrial && " (Trial)"}
                  </span>
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={handleManageSubscription} 
                disabled={loading || !hasRealStripeCustomer}
              >
                Manage Billing
              </Button>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pay as You Go Plan */}
            <Card className={`transition-all relative ${
              currentPlan === "Free" 
                ? "ring-2 ring-green-500 border-green-500 bg-green-50 dark:bg-green-950/20" 
                : "border-border hover:border-primary/50"
            }`}>
              {currentPlan === "Free" && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    ✓ Active Plan
                  </span>
                </div>
              )}
              <CardHeader className={currentPlan === "Free" ? "pt-6" : ""}>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    Pay as You Go
                  </CardTitle>
                  <Badge variant={currentPlan === "Free" ? "default" : "secondary"}>
                    $0/month
                  </Badge>
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
                  
                  {currentPlan !== "Free" && (
                    <div className="pt-4">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => handleSubscribe()}
                        disabled={loading}
                      >
                        {loading ? "Processing..." : "Switch to Pay as You Go"}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className={`transition-all relative ${
              isCurrentPro 
                ? "ring-2 ring-purple-500 border-purple-500 bg-purple-50 dark:bg-purple-950/20" 
                : "border-primary bg-primary/5 hover:border-primary/70"
            }`}>
              {isCurrentPro ? (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-purple-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    ✓ Active Plan {isOnTrial && "(Trial)"}
                  </span>
                </div>
              ) : (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              <CardHeader className="pt-6">
                <div className="flex items-center justify-center">
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-purple-500" />
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
                  
                  {isCurrentPro ? (
                    <div className="pt-4">
                      <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900 dark:text-purple-200">
                        Currently Active {isOnTrial && "- Trial"}
                      </Badge>
                    </div>
                  ) : (
                    <div className="pt-4">
                      <Button 
                        className="w-full bg-primary hover:bg-primary/90"
                        onClick={() => handleSubscribe("pro")}
                        disabled={loading}
                      >
                        {loading 
                          ? "Processing..." 
                          : isOnTrial 
                            ? "Upgrade to Pro" 
                            : "Start 7-Day Pro Trial"
                        }
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>


          {/* Note */}
          <div className="text-center text-sm text-muted-foreground">
            <p>No setup fees, {isCurrentPro ? "manage your subscription anytime" : "cancel anytime"}</p>
            {selectedPlan === "pro" && !isCurrentPro && !isOnTrial && (
              <p className="mt-1">You'll be redirected to Stripe to complete your 7-day trial.</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle, AlertCircle, Link2 } from "lucide-react";
import logoIcon from "@/assets/logo_icon.svg";

export default function OnboardingWebhookInterstitial() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Setting up your account...");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const setupWebhook = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate("/auth");
          return;
        }

        // Check if webhook already exists
        const { data: profile } = await supabase
          .from('profiles')
          .select('webhook_url, webhook_setup_completed')
          .eq('id', user.id)
          .single();

        if (profile?.webhook_setup_completed && profile?.webhook_url) {
          // Already setup, move to next step
          setStatus("success");
          setMessage("Account ready!");
          setTimeout(() => navigate("/onboarding/step-1"), 1000);
          return;
        }

        setProgress(25);
        setMessage("Creating your webhook endpoint...");

        // Animate progress
        const progressInterval = setInterval(() => {
          setProgress(prev => Math.min(prev + 5, 80));
        }, 200);

        // Create webhook
        const { data: webhookData, error: webhookError } = await supabase.functions.invoke('create-hookdeck-webhook', {
          body: {
            user_id: user.id,
            email: user.email,
          },
        });

        clearInterval(progressInterval);

        if (webhookError) {
          console.error('Webhook creation error:', webhookError);
          setStatus("error");
          setMessage(webhookData?.error || "Failed to create webhook. Please try again.");
          return;
        }

        setProgress(100);
        setMessage("Webhook created successfully!");

        // Update profile to mark webhook as completed
        await supabase
          .from('profiles')
          .update({ 
            webhook_setup_completed: true,
            onboarding_step: 1 
          })
          .eq('id', user.id);

        setStatus("success");
        setTimeout(() => {
          navigate("/onboarding/step-1");
        }, 1500);

      } catch (error) {
        console.error('Setup error:', error);
        setStatus("error");
        setMessage("Unexpected error occurred. Please try again.");
      }
    };

    setupWebhook();
  }, [navigate]);

  const handleRetry = () => {
    setStatus("loading");
    setMessage("Setting up your account...");
    setProgress(0);
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 to-primary/10">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <img src={logoIcon} alt="Thank Donors" className="h-16 w-16 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-foreground">Welcome to Thank Donors</h1>
          <p className="text-muted-foreground mt-2">We're getting everything ready for you</p>
        </div>

        <Card>
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              {/* Status Icon */}
              <div className="flex justify-center">
                {status === "loading" && (
                  <div className="relative">
                    <Loader2 className="h-12 w-12 text-primary animate-spin" />
                    <Link2 className="h-6 w-6 text-primary/60 absolute top-3 left-3" />
                  </div>
                )}
                {status === "success" && (
                  <CheckCircle className="h-12 w-12 text-green-500" />
                )}
                {status === "error" && (
                  <AlertCircle className="h-12 w-12 text-destructive" />
                )}
              </div>

              {/* Message */}
              <div>
                <h3 className="text-lg font-medium mb-2">{message}</h3>
                {status === "loading" && (
                  <p className="text-sm text-muted-foreground">
                    This may take a moment...
                  </p>
                )}
              </div>

              {/* Progress Bar */}
              {status === "loading" && (
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}

              {/* Retry Button */}
              {status === "error" && (
                <Button onClick={handleRetry} className="w-full">
                  Try Again
                </Button>
              )}

              {/* Success Animation */}
              {status === "success" && (
                <div className="text-sm text-muted-foreground">
                  Redirecting to setup...
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Setting up your ActBlue webhook integration</p>
        </div>
      </div>
    </div>
  );
}
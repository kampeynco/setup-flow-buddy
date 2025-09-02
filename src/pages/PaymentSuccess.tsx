import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, AlertCircle, Wallet, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [credited, setCredited] = useState<number | null>(null);

  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (!sessionId) {
      setError("No session ID provided");
      setProcessing(false);
      return;
    }

    const processPayment = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('process-balance-payment', {
          body: { sessionId }
        });

        if (error) {
          throw error;
        }

        if (data.success) {
          setSuccess(true);
          setBalance(data.balance);
          setCredited(data.credited);
          
          // Mark onboarding as completed
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase
              .from('profiles')
              .update({ 
                onboarding_completed: true,
                onboarding_step: 4 
              })
              .eq('id', user.id);
          }
          
          toast({
            title: "Payment Successful!",
            description: `$${data.credited} has been credited to your account.`,
          });
        } else {
          throw new Error("Payment processing failed");
        }
      } catch (err) {
        console.error("Payment processing error:", err);
        setError(err instanceof Error ? err.message : "Payment processing failed");
        
        toast({
          title: "Payment Processing Error",
          description: "There was an issue processing your payment. Please contact support.",
          variant: "destructive",
        });
      } finally {
        setProcessing(false);
      }
    };

    processPayment();
  }, [sessionId, toast]);

  const handleContinue = () => {
    navigate("/dashboard", { replace: true });
  };

  if (processing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
            <CardTitle>Processing Payment</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              We're setting up your Pay as You Go account. This will just take a moment...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle className="text-destructive">Payment Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              {error}
            </p>
            <div className="space-y-2">
              <Button onClick={handleContinue} className="w-full">
                Return to Home
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = 'mailto:support@example.com'}
                className="w-full"
              >
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-green-600">Payment Successful!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">
                Your Pay as You Go account has been activated successfully.
              </p>
              
              {credited && balance && (
                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-300 mb-2">
                    <Wallet className="w-4 h-4" />
                    <span className="font-medium">Account Credited</span>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      +${credited.toFixed(2)}
                    </div>
                    <div className="text-sm text-green-600/80 dark:text-green-400/80">
                      Current Balance: ${balance.toFixed(2)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2">What's Next?</h4>
              <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
                <li>• Start sending postcards for $1.99 each</li>
                <li>• Your balance will auto-recharge when it falls below $10</li>
                <li>• View your usage and balance anytime in your dashboard</li>
              </ul>
            </div>

            <Button onClick={handleContinue} className="w-full">
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
import { ReactNode } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronLeft, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoIcon from "@/assets/logo_icon.svg";

interface OnboardingLayoutProps {
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
  title: string;
  description: string;
  onBack?: () => void;
  showBackButton?: boolean;
}

const stepTitles = [
  "Webhook Setup",
  "Sender Details", 
  "Postcard Preview",
  "Billing Setup"
];

export function OnboardingLayout({ 
  children, 
  currentStep, 
  totalSteps, 
  title, 
  description, 
  onBack,
  showBackButton = true
}: OnboardingLayoutProps) {
  const progressPercentage = (currentStep / totalSteps) * 100;
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      navigate("/auth");
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error("Failed to log out");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={logoIcon} alt="Thank Donors" className="h-8 w-8" />
              <span className="font-semibold text-lg">Thank Donors</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {Math.round(progressPercentage)}% complete
              </span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleLogout}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="border-b bg-card/30">
        <div className="container max-w-4xl mx-auto px-4 py-3">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{title}</span>
              <span className="text-muted-foreground">{Math.round(progressPercentage)}% complete</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container max-w-4xl mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Back Button */}
          {showBackButton && onBack && (
            <Button 
              variant="ghost" 
              onClick={onBack}
              className="mb-6 -ml-4"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          )}

          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">{title}</h1>
            <p className="text-muted-foreground text-lg">{description}</p>
          </div>

          {/* Content */}
          {children}
        </div>
      </main>
    </div>
  );
}
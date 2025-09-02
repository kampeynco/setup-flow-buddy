import { ReactNode } from "react";
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

      {/* Steps indicator */}
      <div className="border-b bg-card/20">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center space-x-8">
            {stepTitles.map((stepTitle, index) => {
              const stepNumber = index + 1;
              const isActive = stepNumber === currentStep;
              const isCompleted = stepNumber < currentStep;
              
              return (
                <div key={stepNumber} className="flex items-center">
                  <div className="flex items-center space-x-2">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                      ${isCompleted 
                        ? 'bg-primary text-primary-foreground' 
                        : isActive 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-muted-foreground'
                      }
                    `}>
                      {isCompleted ? '✓' : stepNumber}
                    </div>
                    <span className={`text-sm ${isActive ? 'font-medium' : 'text-muted-foreground'}`}>
                      {stepTitle}
                    </span>
                  </div>
                  {index < stepTitles.length - 1 && (
                    <div className="w-8 h-px bg-border ml-4" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container max-w-4xl mx-auto px-4 py-8">
        <div className={currentStep === 3 ? "w-full" : "max-w-2xl mx-auto"}>
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
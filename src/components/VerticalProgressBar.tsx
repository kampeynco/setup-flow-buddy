import { cn } from "@/lib/utils";
import { Check, Circle, Package, Truck, MapPin, Mail } from "lucide-react";

interface VerticalProgressBarProps {
  currentStatus: string;
  isError?: boolean;
}

const PROGRESS_STEPS = [
  { 
    id: "received", 
    label: "Received", 
    icon: Circle,
    description: "Donation received"
  },
  { 
    id: "production", 
    label: "In Production", 
    icon: Package,
    description: "Creating postcard"
  },
  { 
    id: "mailed", 
    label: "Mailed", 
    icon: Mail,
    description: "Postcard sent"
  },
  { 
    id: "transit", 
    label: "In Transit", 
    icon: Truck,
    description: "On its way"
  },
  { 
    id: "delivered", 
    label: "Delivered", 
    icon: MapPin,
    description: "Successfully delivered"
  }
];

export function VerticalProgressBar({ currentStatus, isError = false }: VerticalProgressBarProps) {
  const getCurrentStepIndex = () => {
    switch (currentStatus.toLowerCase()) {
      case "received":
        return 0;
      case "in production":
        return 1;
      case "mailed":
        return 2;
      case "in transit":
        return 3;
      case "delivered":
        return 4;
      default:
        return 0;
    }
  };

  const currentIndex = getCurrentStepIndex();
  
  const isCompleted = (index: number) => index < currentIndex;
  const isCurrent = (index: number) => index === currentIndex;

  return (
    <div className="relative">
      {PROGRESS_STEPS.map((step, index) => {
        const Icon = step.icon;
        const isLast = index === PROGRESS_STEPS.length - 1;
        
        return (
          <div key={step.id} className="relative">
            <div className="flex items-center">
              {/* Icon Circle */}
              <div className={cn(
                "relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                isError && isCurrent(index) ? 
                  "bg-destructive text-destructive-foreground" :
                isCompleted(index) ? 
                  "bg-green-600 text-white" :
                isCurrent(index) ? 
                  "bg-blue-600 text-white" :
                  "bg-muted border-2 border-muted-foreground/30 text-muted-foreground"
              )}>
                {isCompleted(index) ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              
              {/* Progress Line */}
              {!isLast && (
                <div className={cn(
                  "absolute left-4 top-8 w-0.5 h-12 -translate-x-1/2 transition-all duration-300",
                  isCompleted(index) ? "bg-green-600" : "bg-muted-foreground/20"
                )} />
              )}
              
              {/* Step Content */}
              <div className="ml-4 pb-6">
                <div className={cn(
                  "font-medium text-sm transition-colors duration-300",
                  isError && isCurrent(index) ? 
                    "text-destructive" :
                  isCompleted(index) ? 
                    "text-green-700 dark:text-green-500" :
                  isCurrent(index) ? 
                    "text-blue-700 dark:text-blue-400 font-semibold" :
                    "text-muted-foreground"
                )}>
                  {step.label}
                  {isCurrent(index) && !isError && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      Current
                    </span>
                  )}
                  {isError && isCurrent(index) && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-destructive/10 text-destructive">
                      Error
                    </span>
                  )}
                </div>
                <div className={cn(
                  "text-xs transition-colors duration-300",
                  isError && isCurrent(index) ? 
                    "text-destructive/80" :
                  isCompleted(index) ? 
                    "text-green-600 dark:text-green-400" :
                  isCurrent(index) ? 
                    "text-blue-600 dark:text-blue-300" :
                    "text-muted-foreground/70"
                )}>
                  {step.description}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
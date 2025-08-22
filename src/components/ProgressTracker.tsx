import { cn } from "@/lib/utils";

interface ProgressTrackerProps {
  currentStatus: string;
  isError?: boolean;
}

const PROGRESS_STEPS = [
  "Received",
  "In Production", 
  "Mailed",
  "In Transit",
  "Delivered"
];

export function ProgressTracker({ currentStatus, isError = false }: ProgressTrackerProps) {
  const currentIndex = PROGRESS_STEPS.findIndex(step => 
    step.toLowerCase() === currentStatus.toLowerCase()
  );
  
  const isCompleted = (index: number) => index <= currentIndex;
  const isCurrent = (index: number) => index === currentIndex;

  return (
    <div className="flex flex-col space-y-3 py-2">
      {PROGRESS_STEPS.map((step, index) => (
        <div key={step} className="flex items-center space-x-3">
          {/* Progress Dot */}
          <div className={cn(
            "w-3 h-3 rounded-full border-2 flex-shrink-0",
            isError ? "bg-destructive border-destructive" :
            isCompleted(index) ? "bg-primary border-primary" :
            "bg-muted border-muted-foreground/30"
          )} />
          
          {/* Step Label */}
          <span className={cn(
            "text-sm font-medium",
            isError ? "text-destructive" :
            isCurrent(index) ? "text-primary font-semibold" :
            isCompleted(index) ? "text-foreground" :
            "text-muted-foreground"
          )}>
            {step}
          </span>
        </div>
      ))}
    </div>
  );
}
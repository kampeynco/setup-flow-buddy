import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface VariableChipProps {
  variable: string;
  label: string;
  onClick: (variable: string) => void;
  variant?: "recipient" | "sender";
}

export function VariableChip({ variable, label, onClick, variant = "recipient" }: VariableChipProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "cursor-pointer select-none transition-colors hover:bg-primary hover:text-primary-foreground",
        variant === "recipient" 
          ? "border-primary/30 text-primary hover:border-primary" 
          : "border-muted-foreground/30 text-muted-foreground hover:border-primary"
      )}
      onClick={() => onClick(variable)}
    >
      {label}
    </Badge>
  );
}

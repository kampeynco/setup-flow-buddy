import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusPillProps {
  status: string;
  isError?: boolean;
}

export function StatusPill({ status, isError = false }: StatusPillProps) {
  return (
    <Badge 
      variant={isError ? "destructive" : "secondary"}
      className={cn(
        "text-xs font-medium px-2 py-1",
        !isError && "bg-primary/10 text-primary border-primary/20"
      )}
    >
      {status}
    </Badge>
  );
}
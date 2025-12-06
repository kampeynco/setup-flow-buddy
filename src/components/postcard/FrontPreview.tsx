import { cn } from "@/lib/utils";

interface FrontPreviewProps {
  backgroundImage?: string | null;
  backgroundColor?: string;
  imagePosition?: string;
  className?: string;
}

const INCH_PX = 40; // base scale

export function FrontPreview({ 
  backgroundImage, 
  backgroundColor = "#ffffff",
  imagePosition = "cover",
  className 
}: FrontPreviewProps) {
  const bleedW = 9.25 * INCH_PX;
  const bleedH = 6.25 * INCH_PX;
  const trimInset = 0.125 * INCH_PX;
  const safeInsetFromTrim = 0.0625 * INCH_PX;
  const safeInset = trimInset + safeInsetFromTrim;

  return (
    <div className={className}>
      <div
        className="relative origin-top-left bg-card rounded-lg shadow-sm overflow-hidden"
        style={{ 
          width: bleedW, 
          height: bleedH, 
          transform: "scale(1.5)",
          transformOrigin: "top left"
        }}
        aria-label="Front postcard preview"
      >
        {/* Corner label */}
        <div className="absolute left-2 top-2 text-xs font-medium text-muted-foreground z-10">Front</div>

        {/* Trim size */}
        <div
          className="absolute rounded-sm border border-foreground/10"
          style={{ inset: trimInset }}
        />

        {/* Safe zone with background */}
        <div
          className="absolute overflow-hidden"
          style={{ 
            inset: safeInset,
            backgroundColor: backgroundColor
          }}
        >
          {/* Background Image */}
          {backgroundImage && (
            <img
              src={backgroundImage}
              alt="Postcard front"
              className={cn(
                "absolute",
                imagePosition === "cover" 
                  ? "inset-0 w-full h-full object-cover" 
                  : "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-[90%] max-h-[90%] object-contain"
              )}
            />
          )}
          
          {/* Placeholder when no image */}
          {!backgroundImage && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <p className="text-[8px] font-medium">No image uploaded</p>
                <p className="text-[6px] mt-1">1875 × 1275 px recommended</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Image as ImageIcon, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Postcard dimensions: 1875 x 1275 pixels (6.25" x 4.25" at 300 DPI)
const POSTCARD_WIDTH = 1875;
const POSTCARD_HEIGHT = 1275;
const ASPECT_RATIO = POSTCARD_WIDTH / POSTCARD_HEIGHT;
interface FrontDesignerProps {
  backgroundImage: string | null;
  backgroundColor: string;
  imagePosition: string;
  onImageChange: (image: string | null) => void;
  onBackgroundColorChange: (color: string) => void;
  onImagePositionChange: (position: string) => void;
  className?: string;
}
export function FrontDesigner({
  backgroundImage,
  backgroundColor,
  imagePosition,
  onImageChange,
  onBackgroundColorChange,
  onImagePositionChange,
  className
}: FrontDesignerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be less than 10MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      const dataUrl = e.target?.result as string;

      // Check image dimensions
      const img = new window.Image();
      img.onload = () => {
        setImageDimensions({
          width: img.width,
          height: img.height
        });

        // Show warning if dimensions don't match recommended
        if (img.width < POSTCARD_WIDTH || img.height < POSTCARD_HEIGHT) {
          toast.warning(`Recommended size: ${POSTCARD_WIDTH}×${POSTCARD_HEIGHT}px. Your image: ${img.width}×${img.height}px`);
        }
        onImageChange(dataUrl);
        toast.success("Image uploaded successfully!");
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };
  const handleRemoveImage = () => {
    onImageChange(null);
    setImageDimensions(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.success("Image removed");
  };
  const isImageSizeOptimal = imageDimensions ? imageDimensions.width >= POSTCARD_WIDTH && imageDimensions.height >= POSTCARD_HEIGHT : true;
  return <div className={cn("space-y-6", className)}>
      {/* Image Upload Section */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Front Image</Label>
        <p className="text-xs text-muted-foreground">
          Recommended size: {POSTCARD_WIDTH} × {POSTCARD_HEIGHT} pixels (6.25" × 4.25" at 300 DPI)
        </p>
        
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

        {!backgroundImage ? <div onClick={handleImageUpload} className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors" style={{
        aspectRatio: ASPECT_RATIO
      }}>
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium">Click to upload image</p>
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG, or SVG up to 10MB</p>
            </div>
          </div> : <div className="space-y-3">
            <div className="relative rounded-lg overflow-hidden border border-border" style={{
          aspectRatio: ASPECT_RATIO
        }}>
              <img src={backgroundImage} alt="Postcard front preview" className={cn("w-full h-full", imagePosition === "cover" ? "object-cover" : "object-contain")} style={{
            backgroundColor
          }} />
              
              {/* Dimension badge */}
              {imageDimensions && !isImageSizeOptimal && <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-destructive/90 text-destructive-foreground text-xs rounded">
                  <AlertCircle className="h-3 w-3" />
                  Low resolution
                </div>}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleImageUpload}>
                <ImageIcon className="h-4 w-4 mr-2" />
                Change Image
              </Button>
              <Button variant="ghost" size="sm" onClick={handleRemoveImage}>
                Remove
              </Button>
            </div>
          </div>}
      </div>

      {/* Image Position */}
      {backgroundImage}

      {/* Background Color */}
      
    </div>;
}
import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { OnboardingLayout } from "./OnboardingLayout";
import { cn } from "@/lib/utils";

const INCH_PX = 40; // base scale: 40px per inch (scales via zoom)

function FrontCanvas({ backgroundImage, imagePosition, backgroundColor }: { backgroundImage?: string | null; imagePosition?: string; backgroundColor?: string }) {
  const bleedW = 9.25 * INCH_PX;
  const bleedH = 6.25 * INCH_PX;
  const trimInset = 0.125 * INCH_PX; // (9.25-9)/2 and (6.25-6)/2
  const safeInsetFromTrim = 0.0625 * INCH_PX; // (9-8.875)/2 and (6-5.875)/2
  const safeInset = trimInset + safeInsetFromTrim;

  return (
    <div
      className="relative origin-top"
      style={{ width: bleedW, height: bleedH, transform: "scale(2.0)" }}
      aria-label="Front postcard technical preview"
    >
      {/* Trim size */}
      <div
        className="absolute"
        style={{ inset: trimInset }}
      />

      {/* Safe zone */}
      <div
        className="absolute overflow-hidden"
        style={{ 
          inset: safeInset,
          backgroundColor: backgroundColor || "#ffffff"
        }}
      >
        {/* Background Image */}
        {backgroundImage && (
          <img
            src={backgroundImage}
            alt="Postcard background"
            className={`absolute ${
              imagePosition === "cover" 
                ? "inset-0 w-full h-full object-cover" 
                : "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-[80%] max-h-[80%] object-contain"
            }`}
          />
        )}
      </div>
    </div>
  );
}

function BackCanvas({ messageText }: { messageText?: string }) {
  const bleedW = 9.25 * INCH_PX;
  const bleedH = 6.25 * INCH_PX;
  const trimInset = 0.125 * INCH_PX;
  const safeInsetFromTrim = 0.0625 * INCH_PX;
  const safeInset = trimInset + safeInsetFromTrim;

  // Mailing area: 4" x 2.375" positioned bottom-right within trim area
  const mailingW = 4 * INCH_PX;
  const mailingH = 2.375 * INCH_PX;
  const trimW = 9 * INCH_PX;
  const trimH = 6 * INCH_PX;

  const trimLeft = trimInset;
  const trimTop = trimInset;

  const mailingRightPadding = 0.375 * INCH_PX;
  const mailingBottomPadding = 0.5 * INCH_PX;

  const mailingLeft = trimLeft + (trimW - mailingW - mailingRightPadding);
  const mailingTop = trimTop + (trimH - mailingH - mailingBottomPadding);

  return (
    <div
      className="relative origin-top"
      style={{ width: bleedW, height: bleedH, transform: "scale(2.0)" }}
      aria-label="Back postcard preview"
    >
      {/* Trim size */}
      <div
        className="absolute"
        style={{ inset: trimInset }}
      />

      {/* Safe zone */}
      <div
        className="absolute bg-card"
        style={{ inset: safeInset }}
      />

      {/* Thank you message area (left side, avoiding mailing area) */}
      <div
        className="absolute p-3 text-foreground"
        style={{ 
          left: safeInset, 
          top: safeInset, 
          right: mailingLeft - 10, // Leave space before mailing area
          bottom: safeInset + 40 // Leave space at bottom
        }}
      >
        <div className="text-[7px] leading-tight whitespace-pre-line">
          {messageText || "Thank you for your generous donation! Your support makes our campaign possible."}
        </div>
      </div>

      {/* Mailing area (bottom-right) */}
      <div
        className="absolute rounded-sm bg-transparent p-2 text-foreground/80 relative"
        style={{ left: mailingLeft, top: mailingTop, width: mailingW, height: mailingH }}
      >
        {/* Committee details (top-left, smaller) */}
        <div className="absolute top-2 left-2 text-[7px] leading-none text-muted-foreground text-left py-1 pr-2">
          <div>Placeholder Committee</div>
          <div>123 Main Street</div>
          <div>City, ST 12345</div>
        </div>
        {/* Mailing barcode (above donor details, left-aligned, no overlap) */}
        <div className="absolute left-2 right-2 top-10">
          <img
            src="/lovable-uploads/7d41e453-11de-4cbc-8330-837205bd314a.png"
            alt="Mailing barcode example"
            className="w-full h-auto object-contain opacity-90 scale-y-75"
          />
        </div>
        {/* Donor details (bottom-left, left-aligned, no wrap) */}
        <div className="absolute left-2 bottom-3 text-left text-[9px] leading-none whitespace-nowrap">
          <div>
            <div>Donor Full Name</div>
            <div>456 Donor Avenue</div>
            <div>City, ST 67890</div>
          </div>
        </div>
        {/* Postage indicia (top-right inside mailing area) */}
        <div
          className="absolute top-2 right-2 border border-foreground rounded-sm bg-transparent px-2 py-1 text-[7px] leading-none text-foreground/80 flex items-center justify-center text-center"
          style={{ width: 0.9375 * INCH_PX, height: 0.75 * INCH_PX }}
        >
          Postage Indicia
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPostcardPreview() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"front" | "back">("front");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imagePosition, setImagePosition] = useState<string>("cover");
  const [senderInfo, setSenderInfo] = useState({
    committeeName: "",
    streetAddress: "",
    city: "",
    state: "",
    postalCode: ""
  });
  const [postcardSettings, setPostcardSettings] = useState({
    backgroundColor: "#ffffff",
    textColor: "#333333",
    messageText: "Thank you for your generous donation! Your support makes our campaign possible."
  });

  const zoom = 1.8; // 1.8x = 180%
  const scale = useMemo(() => `scale(${zoom})`, [zoom]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate("/auth");
          return;
        }

        // Load profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          // Check if user should be here
          if (profile.onboarding_completed) {
            navigate("/dashboard");
            return;
          }
          if (profile.onboarding_step < 2) {
            navigate("/onboarding/step-1");
            return;
          }

          setSenderInfo({
            committeeName: profile.committee_name || "",
            streetAddress: profile.street_address || "",
            city: profile.city || "",
            state: profile.state || "",
            postalCode: profile.postal_code || ""
          });

          // Load existing template if available
          const { data: template } = await supabase
            .from('templates')
            .select('*')
            .eq('profile_id', user.id)
            .eq('template_name', 'Onboarding Default')
            .single();

          if (template) {
            setPostcardSettings({
              backgroundColor: template.frontpsc_background_color || "#ffffff",
              textColor: template.frontpsc_text_color || "#333333",
              messageText: template.frontpsc_background_text || "Thank you for your generous donation! Your support makes our campaign possible."
            });
            
            // Load saved image if exists
            if (template.frontpsc_background_image) {
              const imagePath = template.frontpsc_background_image;
              
              // If it's a file path (not a data URL), generate a signed URL
              if (!imagePath.startsWith('data:') && !imagePath.startsWith('http')) {
                try {
                  const { data: signedUrlData, error: urlError } = await supabase.storage
                    .from('templates')
                    .createSignedUrl(imagePath, 60 * 60 * 24); // 24 hours expiration
                    
                  if (!urlError && signedUrlData) {
                    setSelectedImage(signedUrlData.signedUrl);
                  }
                } catch (error) {
                  console.error('Error generating signed URL for saved image:', error);
                }
              } else {
                // It's already a full URL or data URL
                setSelectedImage(imagePath);
              }
            }
            
            // Load image position
            if (template.frontpsc_background_size) {
              setImagePosition(template.frontpsc_background_size);
            }
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };

    loadProfile();
  }, [navigate]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      let imageUrl = null;
      
      // Upload image to storage if one was selected
      if (selectedImage && selectedImage.startsWith('data:')) {
        try {
          // Convert data URL to blob
          const response = await fetch(selectedImage);
          const blob = await response.blob();
          
          // Generate unique filename
          const fileExt = blob.type.split('/')[1] || 'jpg';
          const fileName = `${user.id}/onboarding-${Date.now()}.${fileExt}`;
          
          // Upload to storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('templates')
            .upload(fileName, blob, {
              contentType: blob.type,
              upsert: true
            });
            
          if (uploadError) {
            console.error('Upload error:', uploadError);
            toast.error("Failed to upload image");
            return;
          }
          
          // Get signed URL for private bucket
          const { data: signedUrlData, error: urlError } = await supabase.storage
            .from('templates')
            .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 year expiration
            
          if (urlError) {
            console.error('URL generation error:', urlError);
            toast.error("Failed to generate image URL");
            return;
          }
            
          imageUrl = fileName; // Store file path, not signed URL
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          toast.error("Failed to upload image");
          return;
        }
      }

      // Check if template already exists
      const { data: existingTemplate, error: fetchError } = await supabase
        .from('templates')
        .select('id, frontpsc_background_image')
        .eq('profile_id', user.id)
        .eq('template_name', 'Onboarding Default')
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error checking existing template:', fetchError);
        toast.error("Failed to check existing template");
        return;
      }

      const templateData = {
        profile_id: user.id,
        template_name: 'Onboarding Default',
        frontpsc_background_color: postcardSettings.backgroundColor,
        frontpsc_text_color: postcardSettings.textColor,
        frontpsc_background_text: postcardSettings.messageText,
        frontpsc_bg_type: imageUrl || selectedImage ? 'image' : 'color',
        frontpsc_background_image: imageUrl || selectedImage || null,
        frontpsc_background_size: imagePosition
      };

      let templateError;
      
      if (existingTemplate) {
        // Delete old image if replacing with new one
        if (imageUrl && existingTemplate.frontpsc_background_image) {
          const oldImagePath = existingTemplate.frontpsc_background_image;
          if (oldImagePath && !oldImagePath.startsWith('data:') && !oldImagePath.startsWith('http')) {
            // It's a file path, use it directly
            await supabase.storage
              .from('templates')
              .remove([oldImagePath]);
          }
        }
        
        // Update existing template
        const { error } = await supabase
          .from('templates')
          .update(templateData)
          .eq('id', existingTemplate.id);
        templateError = error;
      } else {
        // Insert new template
        const { error } = await supabase
          .from('templates')
          .insert(templateData);
        templateError = error;
      }

      if (templateError) {
        console.error('Template save error:', templateError);
        toast.error(`Failed to save template: ${templateError.message}`);
        return;
      }

      // Update onboarding step
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ onboarding_step: 3 })
        .eq('id', user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        toast.error(`Failed to update progress: ${profileError.message}`);
        return;
      }

      toast.success("Template saved!");
      navigate("/onboarding/step-3");
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error("Failed to save template");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/onboarding/step-1");
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      toast.success("Image uploaded successfully!");
    }
  };

  return (
    <OnboardingLayout
      currentStep={3}
      totalSteps={4}
      title="Postcard Preview"
      description="See how your postcards will look and customize the message"
      onBack={handleBack}
    >
      {/* Preview Panel - Full Width */}
      <div className="relative flex flex-col" style={{ height: "600px" }}>
        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pr-10">
          <div className="flex items-center gap-4">
            <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
              <TabsList>
                <TabsTrigger value="front">Front</TabsTrigger>
                <TabsTrigger value="back">Back</TabsTrigger>
              </TabsList>
            </Tabs>
            
            {/* Contextual Controls */}
            {tab === "front" ? (
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={postcardSettings.backgroundColor}
                    onChange={(e) => setPostcardSettings(prev => ({ ...prev, backgroundColor: e.target.value }))}
                    className="w-10 h-10 p-1 rounded"
                  />
                  <Input
                    value={postcardSettings.backgroundColor}
                    onChange={(e) => setPostcardSettings(prev => ({ ...prev, backgroundColor: e.target.value }))}
                    placeholder="#ffffff"
                    className="w-24"
                  />
                </div>
                <Button variant="default" size="sm" onClick={handleImageUpload}>
                  {selectedImage ? "Change Image" : "Upload Image"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Select value={imagePosition} onValueChange={setImagePosition}>
                  <SelectTrigger className="w-24 h-8">
                    <SelectValue placeholder="Position" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border shadow-lg z-50">
                    <SelectItem value="cover">Cover</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="default" size="sm">
                    Edit Message
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Thank You Message</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Textarea
                      value={postcardSettings.messageText}
                      onChange={(e) => {
                        const words = e.target.value.split(/\s+/).filter(word => word.length > 0);
                        if (words.length <= 100) {
                          setPostcardSettings(prev => ({ ...prev, messageText: e.target.value }));
                        }
                      }}
                      placeholder="Enter your thank you message (100 words max)..."
                      rows={4}
                    />
                    <div className="text-xs text-muted-foreground text-right">
                      {postcardSettings.messageText.split(/\s+/).filter(word => word.length > 0).length}/100 words
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Preview area */}
        <div className="mt-4 flex-1 min-h-0 overflow-auto flex items-start justify-center">
          {tab === "front" && (
            <FrontCanvas 
              backgroundImage={selectedImage} 
              imagePosition={imagePosition}
              backgroundColor={postcardSettings.backgroundColor}
            />
          )}
          {tab === "back" && (
            <BackCanvas messageText={postcardSettings.messageText} />
          )}
        </div>
      </div>

      <div className="flex justify-end mt-8">
        <Button 
          onClick={handleSave}
          disabled={loading}
          className="min-w-32"
        >
          {loading ? "Saving..." : "Continue"}
        </Button>
      </div>
    </OnboardingLayout>
  );
}
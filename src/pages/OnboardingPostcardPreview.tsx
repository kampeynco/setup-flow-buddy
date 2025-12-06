import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { OnboardingLayout } from "./OnboardingLayout";
import { MessageBuilder, FrontDesigner, FrontPreview, BackPreview } from "@/components/postcard";

const DEFAULT_MESSAGE = `Dear %FIRST_NAME%,

Thank you for your generous donation! Your support makes our campaign possible.

With gratitude,
%SENDER_FULL_NAME%`;

export default function OnboardingPostcardPreview() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"front" | "back">("front");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imagePosition, setImagePosition] = useState<string>("cover");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [messageTemplate, setMessageTemplate] = useState(DEFAULT_MESSAGE);
  const [senderInfo, setSenderInfo] = useState({
    committeeName: "",
    streetAddress: "",
    city: "",
    state: "",
    postalCode: ""
  });

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
            setBackgroundColor(template.frontpsc_background_color || "#ffffff");
            
            // Use backpsc_message_template if available, otherwise fall back to frontpsc_background_text
            const savedMessage = (template as any).backpsc_message_template || template.frontpsc_background_text;
            if (savedMessage) {
              setMessageTemplate(savedMessage);
            }
            
            // Load saved image if exists
            if (template.frontpsc_background_image) {
              const imagePath = template.frontpsc_background_image;
              
              if (!imagePath.startsWith('data:') && !imagePath.startsWith('http')) {
                try {
                  const { data: signedUrlData, error: urlError } = await supabase.storage
                    .from('templates')
                    .createSignedUrl(imagePath, 60 * 60 * 24);
                    
                  if (!urlError && signedUrlData) {
                    setSelectedImage(signedUrlData.signedUrl);
                  }
                } catch (error) {
                  console.error('Error generating signed URL for saved image:', error);
                }
              } else {
                setSelectedImage(imagePath);
              }
            }
            
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
          const response = await fetch(selectedImage);
          const blob = await response.blob();
          
          const fileExt = blob.type.split('/')[1] || 'jpg';
          const fileName = `${user.id}/onboarding-${Date.now()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
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
            
          imageUrl = fileName;
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
        frontpsc_background_color: backgroundColor,
        frontpsc_bg_type: imageUrl || selectedImage ? 'image' : 'color',
        frontpsc_background_image: imageUrl || selectedImage || null,
        frontpsc_background_size: imagePosition,
        backpsc_message_template: messageTemplate,
        // Keep backward compatibility
        frontpsc_background_text: messageTemplate
      };

      let templateError;
      
      if (existingTemplate) {
        // Delete old image if replacing with new one
        if (imageUrl && existingTemplate.frontpsc_background_image) {
          const oldImagePath = existingTemplate.frontpsc_background_image;
          if (oldImagePath && !oldImagePath.startsWith('data:') && !oldImagePath.startsWith('http')) {
            await supabase.storage
              .from('templates')
              .remove([oldImagePath]);
          }
        }
        
        const { error } = await supabase
          .from('templates')
          .update(templateData)
          .eq('id', existingTemplate.id);
        templateError = error;
      } else {
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

  const senderDetails = {
    committee_name: senderInfo.committeeName,
    organization_name: senderInfo.committeeName,
    street_address: senderInfo.streetAddress,
    city: senderInfo.city,
    state: senderInfo.state,
    postal_code: senderInfo.postalCode
  };

  return (
    <OnboardingLayout
      currentStep={3}
      totalSteps={4}
      title="Design Your Postcard"
      description="Upload an image for the front and customize the thank-you message for the back"
      onBack={handleBack}
    >
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column: Editor */}
        <div className="space-y-6">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "front" | "back")}>
            <TabsList className="w-full">
              <TabsTrigger value="front" className="flex-1">Front Design</TabsTrigger>
              <TabsTrigger value="back" className="flex-1">Back Message</TabsTrigger>
            </TabsList>
          </Tabs>

          {tab === "front" ? (
            <FrontDesigner
              backgroundImage={selectedImage}
              backgroundColor={backgroundColor}
              imagePosition={imagePosition}
              onImageChange={setSelectedImage}
              onBackgroundColorChange={setBackgroundColor}
              onImagePositionChange={setImagePosition}
            />
          ) : (
            <MessageBuilder
              value={messageTemplate}
              onChange={setMessageTemplate}
              maxLength={500}
            />
          )}
        </div>

        {/* Right Column: Preview */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            {tab === "front" ? "Front Preview" : "Back Preview"}
          </h3>
          
          <div className="overflow-auto rounded-lg border border-border bg-muted/20 p-6" style={{ minHeight: 420 }}>
            {tab === "front" ? (
              <FrontPreview
                backgroundImage={selectedImage}
                backgroundColor={backgroundColor}
                imagePosition={imagePosition}
              />
            ) : (
              <BackPreview
                messageTemplate={messageTemplate}
                senderDetails={senderDetails}
              />
            )}
          </div>
          
          <p className="text-xs text-muted-foreground">
            {tab === "front" 
              ? "Recommended: 1875 × 1275 pixels (6.25\" × 4.25\" at 300 DPI)"
              : "Variables will be replaced with actual donor/sender data when printed"
            }
          </p>
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

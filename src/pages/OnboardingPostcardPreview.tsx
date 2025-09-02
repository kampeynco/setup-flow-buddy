import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { OnboardingLayout } from "./OnboardingLayout";
import { cn } from "@/lib/utils";

const INCH_PX = 40; // base scale: 40px per inch (scales via zoom)

function FrontCanvas({ backgroundColor, textColor, messageText, committeeName, senderInfo }: {
  backgroundColor: string;
  textColor: string;
  messageText: string;
  committeeName: string;
  senderInfo: any;
}) {
  const bleedW = 9.25 * INCH_PX;
  const bleedH = 6.25 * INCH_PX;
  const trimInset = 0.125 * INCH_PX;
  const safeInsetFromTrim = 0.0625 * INCH_PX;
  const safeInset = trimInset + safeInsetFromTrim;

  return (
    <div
      className="relative"
      style={{ width: bleedW, height: bleedH }}
      aria-label="Front postcard preview"
    >
      {/* Corner label */}
      <div className="absolute left-2 top-2 text-xs font-medium text-muted-foreground">Front</div>

      {/* Trim size */}
      <div
        className="absolute rounded-sm border border-foreground/10"
        style={{ inset: trimInset }}
      />

      {/* Safe zone with content */}
      <div
        className="absolute rounded-sm border border-background/80 flex items-center justify-center p-4"
        style={{ 
          inset: safeInset, 
          backgroundColor, 
          color: textColor 
        }}
      >
        <div className="text-center">
          <div className="text-lg font-semibold mb-2">
            {committeeName || "Your Committee Name"}
          </div>
          <div className="text-sm mb-4">
            {messageText}
          </div>
          <div className="text-xs opacity-75">
            {senderInfo.streetAddress && (
              <div>{senderInfo.streetAddress}</div>
            )}
            {(senderInfo.city || senderInfo.state || senderInfo.postalCode) && (
              <div>
                {senderInfo.city}{senderInfo.city && senderInfo.state ? ', ' : ''}{senderInfo.state} {senderInfo.postalCode}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BackCanvas() {
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
      className="relative"
      style={{ width: bleedW, height: bleedH }}
      aria-label="Back postcard preview"
    >
      {/* Corner label */}
      <div className="absolute left-2 top-2 text-xs font-medium text-muted-foreground">Back</div>

      {/* Trim size */}
      <div
        className="absolute rounded-sm border border-foreground/10"
        style={{ inset: trimInset }}
      />

      {/* Safe zone */}
      <div
        className="absolute rounded-sm border border-background/80 bg-card"
        style={{ inset: safeInset }}
      />

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

      // Check if template already exists
      const { data: existingTemplate, error: fetchError } = await supabase
        .from('templates')
        .select('id')
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
        frontpsc_bg_type: 'color'
      };

      let templateError;
      
      if (existingTemplate) {
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

  return (
    <OnboardingLayout
      currentStep={3}
      totalSteps={4}
      title="Postcard Preview"
      description="See how your postcards will look and customize the message"
      onBack={handleBack}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Customization Panel */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Customize Your Postcard</h3>
            
            {tab === "front" ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="message-text">Thank You Message</Label>
                  <Textarea
                    id="message-text"
                    value={postcardSettings.messageText}
                    onChange={(e) => setPostcardSettings(prev => ({ ...prev, messageText: e.target.value }))}
                    placeholder="Enter your thank you message..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bg-color">Background Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="bg-color"
                        type="color"
                        value={postcardSettings.backgroundColor}
                        onChange={(e) => setPostcardSettings(prev => ({ ...prev, backgroundColor: e.target.value }))}
                        className="w-12 h-10 p-1 rounded"
                      />
                      <Input
                        value={postcardSettings.backgroundColor}
                        onChange={(e) => setPostcardSettings(prev => ({ ...prev, backgroundColor: e.target.value }))}
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="text-color">Text Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="text-color"
                        type="color"
                        value={postcardSettings.textColor}
                        onChange={(e) => setPostcardSettings(prev => ({ ...prev, textColor: e.target.value }))}
                        className="w-12 h-10 p-1 rounded"
                      />
                      <Input
                        value={postcardSettings.textColor}
                        onChange={(e) => setPostcardSettings(prev => ({ ...prev, textColor: e.target.value }))}
                        placeholder="#333333"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-sm text-muted-foreground">
                  <p>The back of your postcard contains the mailing area with:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Your committee details (top-left)</li>
                    <li>Mailing barcode for postal processing</li>
                    <li>Donor address details (bottom-left)</li>
                    <li>Postage indicia (top-right)</li>
                  </ul>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    The back layout is automatically formatted according to USPS standards and cannot be customized.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview Panel */}
        <div className="relative flex flex-col h-full">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
            <h3 className="text-lg font-semibold">Preview</h3>
            <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
              <TabsList>
                <TabsTrigger value="front">Front</TabsTrigger>
                <TabsTrigger value="back">Back</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Preview area */}
          <div className="rounded-md border bg-muted p-4 flex-1 min-h-0">
            <div className="flex h-full w-full items-start justify-center overflow-hidden">
              <div
                className={cn("origin-top animate-fade-in", tab === "front" ? "" : "hidden")}
                style={{ transform: scale }}
              >
                <FrontCanvas 
                  backgroundColor={postcardSettings.backgroundColor}
                  textColor={postcardSettings.textColor}
                  messageText={postcardSettings.messageText}
                  committeeName={senderInfo.committeeName}
                  senderInfo={senderInfo}
                />
              </div>
              <div
                className={cn("origin-top animate-fade-in", tab === "back" ? "" : "hidden")}
                style={{ transform: scale }}
              >
                <BackCanvas />
              </div>
            </div>
          </div>

          <div className="mt-4 text-xs text-muted-foreground text-center">
            This is a technical preview showing print dimensions and safe zones.
          </div>
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
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { FrontPreview, BackPreview } from "@/components/postcard";

const DEFAULT_MESSAGE = `Dear %FIRST_NAME%,

Thank you for your generous donation! Your support makes our campaign possible.

With gratitude,
%SENDER_FULL_NAME%`;

interface PreviewPostcardDialogProps {
  currentUserId: string | null;
}

export function PreviewPostcardDialog({ currentUserId }: PreviewPostcardDialogProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"front" | "back">("front");
  const [loading, setLoading] = useState(false);
  
  // Template state
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [imagePosition, setImagePosition] = useState("cover");
  const [messageTemplate, setMessageTemplate] = useState(DEFAULT_MESSAGE);
  
  // Sender details
  const [senderDetails, setSenderDetails] = useState<{
    committee_name?: string;
    organization_name?: string;
    street_address?: string;
    city?: string;
    state?: string;
    postal_code?: string;
  }>({});

  // Load template when dialog opens
  useEffect(() => {
    if (open && currentUserId) {
      loadTemplate();
    }
  }, [open, currentUserId]);

  const loadTemplate = async () => {
    if (!currentUserId) return;
    
    setLoading(true);
    try {
      // Load profile for sender details
      const { data: profile } = await supabase
        .from('profiles')
        .select('committee_name, organization_name, street_address, city, state, postal_code')
        .eq('id', currentUserId)
        .single();

      if (profile) {
        setSenderDetails(profile);
      }

      // Load template
      const { data: template } = await supabase
        .from('templates')
        .select('*')
        .eq('profile_id', currentUserId)
        .eq('template_name', 'Onboarding Default')
        .single();

      if (template) {
        setBackgroundColor(template.frontpsc_background_color || "#ffffff");
        setImagePosition(template.frontpsc_background_size || "cover");
        
        const savedMessage = (template as any).backpsc_message_template || template.frontpsc_background_text;
        if (savedMessage) {
          setMessageTemplate(savedMessage);
        }

        // Load saved image
        if (template.frontpsc_background_image) {
          const imagePath = template.frontpsc_background_image;
          
          if (!imagePath.startsWith('data:') && !imagePath.startsWith('http')) {
            try {
              const { data: signedUrlData, error: urlError } = await supabase.storage
                .from('templates')
                .createSignedUrl(imagePath, 60 * 60 * 24);
                
              if (!urlError && signedUrlData) {
                setBackgroundImage(signedUrlData.signedUrl);
              }
            } catch (error) {
              console.error('Error generating signed URL:', error);
            }
          } else {
            setBackgroundImage(imagePath);
          }
        }
      }
    } catch (error) {
      console.error('Error loading template:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">Preview</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[720px] max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Postcard Preview</DialogTitle>
          <DialogDescription>
            Preview how your postcard will look with sample data
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading preview...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Tabs value={tab} onValueChange={(v) => setTab(v as "front" | "back")}>
              <TabsList className="w-full">
                <TabsTrigger value="front" className="flex-1">Front</TabsTrigger>
                <TabsTrigger value="back" className="flex-1">Back</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="overflow-auto rounded-lg border border-border bg-muted/20 p-6" style={{ minHeight: 400 }}>
              {tab === "front" ? (
                <FrontPreview
                  backgroundImage={backgroundImage}
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
            
            <p className="text-xs text-muted-foreground text-center">
              {tab === "front" 
                ? "Front of postcard (1875 × 1275 pixels)"
                : "Back of postcard with sample data. Variables will be replaced with actual donor information when printed."
              }
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { MessageBuilder, FrontDesigner, FrontPreview, BackPreview } from "@/components/postcard";
const DEFAULT_MESSAGE = `Dear %FIRST_NAME%,

Thank you for your generous donation! Your support makes our campaign possible.

With gratitude,
%SENDER_FULL_NAME%`;
interface DesignPostcardDialogProps {
  currentUserId: string | null;
}
export function DesignPostcardDialog({
  currentUserId
}: DesignPostcardDialogProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"front" | "back">("front");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Design state
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [imagePosition, setImagePosition] = useState("cover");
  const [messageTemplate, setMessageTemplate] = useState(DEFAULT_MESSAGE);

  // Sender details for preview
  const [senderDetails, setSenderDetails] = useState<{
    committee_name?: string;
    organization_name?: string;
    street_address?: string;
    city?: string;
    state?: string;
    postal_code?: string;
  }>({});

  // Load existing template when dialog opens
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
      const {
        data: profile
      } = await supabase.from('profiles').select('committee_name, organization_name, street_address, city, state, postal_code').eq('id', currentUserId).single();
      if (profile) {
        setSenderDetails(profile);
      }

      // Load template
      const {
        data: template
      } = await supabase.from('templates').select('*').eq('profile_id', currentUserId).eq('template_name', 'Onboarding Default').single();
      if (template) {
        setBackgroundColor(template.frontpsc_background_color || "#ffffff");
        setImagePosition(template.frontpsc_background_size || "cover");

        // Use backpsc_message_template if available
        const savedMessage = (template as any).backpsc_message_template || template.frontpsc_background_text;
        if (savedMessage) {
          setMessageTemplate(savedMessage);
        }

        // Load saved image
        if (template.frontpsc_background_image) {
          const imagePath = template.frontpsc_background_image;
          if (!imagePath.startsWith('data:') && !imagePath.startsWith('http')) {
            try {
              const {
                data: signedUrlData,
                error: urlError
              } = await supabase.storage.from('templates').createSignedUrl(imagePath, 60 * 60 * 24);
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
  const handleSave = async () => {
    if (!currentUserId) {
      toast.error("Not authenticated");
      return;
    }
    setSaving(true);
    try {
      let imageUrl = null;

      // Upload image if it's a new data URL
      if (backgroundImage && backgroundImage.startsWith('data:')) {
        const response = await fetch(backgroundImage);
        const blob = await response.blob();
        const fileExt = blob.type.split('/')[1] || 'jpg';
        const fileName = `${currentUserId}/design-${Date.now()}.${fileExt}`;
        const {
          error: uploadError
        } = await supabase.storage.from('templates').upload(fileName, blob, {
          contentType: blob.type,
          upsert: true
        });
        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error("Failed to upload image");
          return;
        }
        imageUrl = fileName;
      }

      // Check if template exists
      const {
        data: existingTemplate
      } = await supabase.from('templates').select('id, frontpsc_background_image').eq('profile_id', currentUserId).eq('template_name', 'Onboarding Default').single();
      const templateData = {
        profile_id: currentUserId,
        template_name: 'Onboarding Default',
        frontpsc_background_color: backgroundColor,
        frontpsc_bg_type: imageUrl || backgroundImage ? 'image' : 'color',
        frontpsc_background_image: imageUrl || backgroundImage || null,
        frontpsc_background_size: imagePosition,
        backpsc_message_template: messageTemplate,
        frontpsc_background_text: messageTemplate // backward compatibility
      };
      if (existingTemplate) {
        // Delete old image if replacing
        if (imageUrl && existingTemplate.frontpsc_background_image) {
          const oldPath = existingTemplate.frontpsc_background_image;
          if (oldPath && !oldPath.startsWith('data:') && !oldPath.startsWith('http')) {
            await supabase.storage.from('templates').remove([oldPath]);
          }
        }
        const {
          error
        } = await supabase.from('templates').update(templateData).eq('id', existingTemplate.id);
        if (error) throw error;
      } else {
        const {
          error
        } = await supabase.from('templates').insert(templateData);
        if (error) throw error;
      }
      toast.success("Design saved successfully!");
      setOpen(false);
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error("Failed to save design");
    } finally {
      setSaving(false);
    }
  };
  return <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" data-design-trigger>Design</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] sm:max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 px-6 py-4 border-b">
          <DialogTitle>Design Postcard</DialogTitle>
          <DialogDescription>
            Upload an image for the front (1875×1275px) and create a message with merge variables for the back.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto px-6 py-4">
          {loading ? <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Loading template...</p>
            </div> : <div className="space-y-4">
              <Tabs value={tab} onValueChange={v => setTab(v as "front" | "back")}>
                <TabsList className="w-full">
                  <TabsTrigger value="front" className="flex-1">Front Design</TabsTrigger>
                  <TabsTrigger value="back" className="flex-1">Back Message</TabsTrigger>
                </TabsList>
              </Tabs>

              {tab === "front" ? <div className="grid lg:grid-cols-2 gap-6">
                  {/* Left: Front Preview */}
                  
                  
                  {/* Right: Front Fields */}
                  <div>
                    <FrontDesigner backgroundImage={backgroundImage} backgroundColor={backgroundColor} imagePosition={imagePosition} onImageChange={setBackgroundImage} onBackgroundColorChange={setBackgroundColor} onImagePositionChange={setImagePosition} />
                  </div>
                </div> : <div className="grid lg:grid-cols-2 gap-6">
                  {/* Left: Back Preview */}
                  
                  
                  {/* Right: Message Builder */}
                  <div>
                    <MessageBuilder value={messageTemplate} onChange={setMessageTemplate} maxLength={500} />
                  </div>
                </div>}
            </div>}
        </div>

        <div className="border-t border-border bg-background px-6 py-4 flex items-center justify-end gap-3 flex-shrink-0">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>;
}
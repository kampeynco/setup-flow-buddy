import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { OnboardingLayout } from "./OnboardingLayout";

export default function OnboardingSenderDetails() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
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

        // Load existing profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('committee_name, street_address, city, state, postal_code, onboarding_completed')
          .eq('id', user.id)
          .single();

        if (profile) {
          // Check if already completed onboarding
          if (profile.onboarding_completed) {
            navigate("/dashboard");
            return;
          }

          setFormData({
            committeeName: profile.committee_name || "",
            streetAddress: profile.street_address || "",
            city: profile.city || "",
            state: profile.state || "",
            postalCode: profile.postal_code || ""
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };

    loadProfile();
  }, [navigate]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    // Validate required fields
    if (!formData.committeeName.trim()) {
      toast.error("Committee name is required");
      return;
    }
    if (!formData.streetAddress.trim()) {
      toast.error("Street address is required");
      return;
    }
    if (!formData.city.trim()) {
      toast.error("City is required");
      return;
    }
    if (!formData.state.trim()) {
      toast.error("State is required");
      return;
    }
    if (!formData.postalCode.trim()) {
      toast.error("Postal code is required");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          committee_name: formData.committeeName.trim(),
          street_address: formData.streetAddress.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          postal_code: formData.postalCode.trim(),
          onboarding_step: 2
        })
        .eq('id', user.id);

      if (error) {
        toast.error("Failed to save details");
        return;
      }

      toast.success("Details saved!");
      navigate("/onboarding/step-2");
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error("Failed to save details");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/onboarding/webhook");
  };

  return (
    <OnboardingLayout
      currentStep={2}
      totalSteps={4}
      title="Sender Details"
      description="Tell us about your committee so we can include your information on postcards"
      onBack={handleBack}
    >
      <Card>
        <CardContent className="p-6">
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="committee-name">Committee Name *</Label>
              <Input
                id="committee-name"
                value={formData.committeeName}
                onChange={(e) => handleInputChange('committeeName', e.target.value)}
                placeholder="e.g., Friends of Jane Smith"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="street-address">Street Address *</Label>
              <Input
                id="street-address"
                value={formData.streetAddress}
                onChange={(e) => handleInputChange('streetAddress', e.target.value)}
                placeholder="e.g., 123 Main Street"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="e.g., Washington"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  placeholder="e.g., DC"
                  maxLength={2}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="postal-code">ZIP Code *</Label>
              <Input
                id="postal-code"
                value={formData.postalCode}
                onChange={(e) => handleInputChange('postalCode', e.target.value)}
                placeholder="e.g., 20001"
                maxLength={10}
                required
              />
            </div>

            <div className="flex justify-end pt-6">
              <Button 
                type="submit" 
                disabled={loading}
                className="min-w-32"
              >
                {loading ? "Saving..." : "Continue"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        <p>This information will appear on all postcards you send</p>
      </div>
    </OnboardingLayout>
  );
}
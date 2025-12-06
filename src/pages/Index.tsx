import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Copy, Check, Eye, EyeOff, ChevronDown, X, Info } from "lucide-react";
import { toast } from "sonner";
import { DesignPostcardDialog, PreviewPostcardDialog } from "@/components/postcard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import SettingsDialog from "@/components/SettingsDialog";
import { DonationsTable } from "@/components/DonationsTable";
import { SubscriptionPill } from "@/components/SubscriptionPill";

import { supabase } from "@/integrations/supabase/client";
import { cleanupAuthState } from "@/lib/utils";

// Simple SEO helpers for SPA
function useSEO({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  useEffect(() => {
    document.title = title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", description);else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = description;
      document.head.appendChild(m);
    }
    const linkCanonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!linkCanonical) {
      const l = document.createElement("link");
      l.rel = "canonical";
      l.href = window.location.href;
      document.head.appendChild(l);
    } else linkCanonical.href = window.location.href;
  }, [title, description]);
}
function CopyField({
  id,
  label,
  value,
  type = "text",
  hidden
}: {
  id: string;
  label: string;
  value: string;
  type?: "text" | "password" | "url";
  hidden?: boolean;
}) {
  const displayValue = hidden && type !== "url" ? "•".repeat(Math.max(8, Math.min(16, value.length))) : value;
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`${label} copied`);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };
  return <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input id={id} type={hidden && type !== "url" ? "password" : type} value={displayValue} readOnly className="pr-24" />
        <Button type="button" onClick={onCopy} variant="secondary" size="sm" className="absolute right-2 top-1/2 -translate-y-1/2">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>;
}
const steps = [
  { id: 1, title: "Enter Committee Details", cta: "Enter Details", note: undefined },
  { id: 2, title: "Design Postcard", cta: "Design Card", note: undefined },
  { id: 3, title: "Add Billing", cta: "Preview Card", note: undefined }
];
const Index = () => {
  useSEO({
    title: "Setup Dashboard – Add ActBlue Account",
    description: "Clean, responsive dashboard to configure your account and ActBlue webhook details."
  });
  const [showSecrets, setShowSecrets] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  // ActBlue webhook fields loaded from Supabase profile
  const [actblueEndpoint, setActblueEndpoint] = useState("");
  const [actblueUsername, setActblueUsername] = useState("");
  const [actbluePassword, setActbluePassword] = useState("");
  const [loadingWebhook, setLoadingWebhook] = useState(true);
  const [fetchingPassword, setFetchingPassword] = useState(false);

  // Billing state (for onboarding)
  const [selectedPlan, setSelectedPlan] = useState("free");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [committeeName, setCommitteeName] = useState("");
  const [street, setStreet] = useState("");
  const [unitAddr, setUnitAddr] = useState("");
  const [cityName, setCityName] = useState("");
  const [region, setRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);


  // Session timeout state
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds

  // User profile state
  const [userProfile, setUserProfile] = useState<{ email?: string; committee_name?: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const handleManageBilling = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) {
        console.error('Error opening customer portal:', error);
        toast.error('Failed to open billing portal');
        return;
      }
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error('Failed to open billing portal');
    }
  };

  const handleSignOut = async () => {
    try {
      cleanupAuthState();
      try { await supabase.auth.signOut({ scope: 'global' }); } catch {}
    } finally {
      window.location.href = "/auth";
    }
  };

  // Fetch webhook password
  const fetchWebhookPassword = async () => {
    setFetchingPassword(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-webhook-credentials');
      if (error) {
        console.error('Error fetching webhook password:', error);
        return 'Unable to retrieve password';
      }
      return data?.password || 'No password found';
    } catch (error) {
      console.error('Error fetching webhook password:', error);
      return 'Unable to retrieve password';
    } finally {
      setFetchingPassword(false);
    }
  };

  // Fetch user profile data
  const fetchUserProfile = async () => {
    try {
      setProfileLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('committee_name, webhook_url')
        .eq('id', user.id)
        .single();

      setUserProfile({
        email: user.email,
        committee_name: profile?.committee_name
      });

      // If webhook exists, fetch the password
      if (profile?.webhook_url) {
        const password = await fetchWebhookPassword();
        setActbluePassword(password);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Fallback to just user email
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserProfile({ email: user.email });
      }
    } finally {
      setProfileLoading(false);
    }
  };

  // Session timeout management
  const startSessionTimeout = useCallback(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      toast.info("Session expired due to inactivity");
      handleSignOut();
    }, SESSION_TIMEOUT);
  }, []);

  const resetSessionTimeout = useCallback(() => {
    startSessionTimeout();
  }, [startSessionTimeout]);

  // Activity event listeners to reset timeout
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, resetSessionTimeout, true);
    });

    // Start initial timeout
    startSessionTimeout();

    return () => {
      // Clean up event listeners
      events.forEach(event => {
        document.removeEventListener(event, resetSessionTimeout, true);
      });
      
      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [startSessionTimeout, resetSessionTimeout]);

  // Load user profile on mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Load profile address fields
  const loadAddressProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('committee_name, street_address, city, state, postal_code')
        .eq('id', userId)
        .maybeSingle();
      if (error) return;
      if (data) {
        setCommitteeName(data.committee_name ?? '');
        setStreet(data.street_address ?? '');
        setCityName(data.city ?? '');
        setRegion(data.state ?? '');
        setPostalCode(data.postal_code ?? '');
        setUnitAddr('');
      }
    } catch {}
  };

  // Save profile address fields
  const handleSaveAddress = async () => {
    if (!currentUserId) return;
    setSavingAddress(true);
    try {
      const street_address = (street + ' ' + (unitAddr || '')).trim();
      const { error } = await supabase.from('profiles').upsert({
        id: currentUserId,
        committee_name: committeeName || null,
        street_address: street_address || null,
        city: cityName || null,
        state: region || null,
        postal_code: postalCode || null,
      });
      if (error) {
        toast.error('Failed to save address');
      } else {
        toast.success('Address saved');
        setAddressDialogOpen(false);
      }
    } catch (e) {
      toast.error('Failed to save address');
    } finally {
      setSavingAddress(false);
    }
  };

  // Auth + profile/webhook provisioning
  const provisionWebhookIfNeeded = async (userId: string, userEmail: string) => {
    try {
      setLoadingWebhook(true);
      // Ensure profile exists
      const { data: existing, error: selectError } = await supabase
        .from('profiles')
        .select('id, webhook_url')
        .eq('id', userId)
        .maybeSingle();

      let profile = existing;

      if (!profile) {
        const { error: insertError } = await supabase.from('profiles').insert({ id: userId });
        if (insertError) {
          console.error('Insert profile error', insertError);
          toast.error('Could not create your profile. Please try again.');
          setLoadingWebhook(false);
          return;
        }
        const { data: refetched } = await supabase
          .from('profiles')
          .select('id, webhook_url')
          .eq('id', userId)
          .maybeSingle();
        profile = refetched || null;
      }

      if (!profile?.webhook_url) {
        if (!userEmail) {
          toast.error('Missing account email. Please sign out and sign back in.');
          setLoadingWebhook(false);
          return;
        }
        toast.info('Creating your ActBlue webhook...');
        console.log('Calling create-hookdeck-webhook with:', { user_id: userId, email: userEmail });
        const { data: fnData, error: fnError } = await supabase.functions.invoke('create-hookdeck-webhook', {
          body: {
            user_id: userId,
            email: userEmail,
          },
        });
        console.log('Function response:', { fnData, fnError });
        if (fnError) {
          console.error('Webhook creation error', fnError, fnData);
          const serverMessage = (fnData as any)?.error || (fnError as any)?.message || 'Failed to create webhook.';
          toast.error(serverMessage);
          setLoadingWebhook(false);
          return;
        }
        toast.success('Webhook created');
        const { data: after } = await supabase
          .from('profiles')
          .select('webhook_url')
          .eq('id', userId)
          .maybeSingle();
        setActblueEndpoint(after?.webhook_url || '');
        
        // Fetch the actual password
        const password = await fetchWebhookPassword();
        setActbluePassword(password);
      } else {
        setActblueEndpoint(profile.webhook_url || '');
        
        // Fetch the actual password
        const password = await fetchWebhookPassword();
        setActbluePassword(password);
      }
    } catch (e) {
      console.error('Provisioning error', e);
      toast.error('Unexpected error provisioning webhook');
    } finally {
      setLoadingWebhook(false);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setActblueUsername(session?.user?.email ?? '');
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        window.location.href = '/auth';
        return;
      }
      setActblueUsername(session.user.email ?? '');
      setCurrentUserId(session.user.id);
      loadAddressProfile(session.user.id);
      provisionWebhookIfNeeded(session.user.id, session.user.email ?? '');
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);


  return <div className="min-h-screen">
      <header className="sticky top-0 z-50 bg-primary border-b">
        <div className="mx-auto max-w-[1024px] px-4 sm:px-6 lg:px-0 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 bg-card text-primary hover:bg-card/90">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback>
                      {profileLoading ? 'L' : (userProfile?.committee_name || userProfile?.email)?.charAt(0).toUpperCase() || 'L'}
                    </AvatarFallback>
                  </Avatar>
                  {profileLoading 
                    ? 'Loading...' 
                    : (userProfile?.committee_name || userProfile?.email || 'Account')
                  }
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="z-50 bg-popover">
                <DropdownMenuItem onSelect={handleManageBilling}>Manage Plan</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => {
                  // Trigger the existing design dialog
                  const designButton = document.querySelector('[data-design-trigger]') as HTMLButtonElement;
                  if (designButton) designButton.click();
                }}>Design Card</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setSettingsOpen(true)}>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleSignOut}>Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <SubscriptionPill />
          </div>

          <Button 
            className="bg-card text-primary hover:bg-card/90"
            onClick={() => toast.info("Referral program coming soon!")}
          >
            Get Free Month
          </Button>
        </div>
      </header>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />

      <main className="mx-auto max-w-[1024px] px-4 sm:px-6 lg:pl-0 py-8 grid gap-8 sm:gap-10 lg:gap-12 lg:grid-cols-[488px_1fr] md:justify-items-center lg:justify-items-stretch">
        <aside className="bg-transparent md:max-w-[488px] md:mx-auto lg:mx-0">
          <nav aria-label="Setup steps" className="bg-muted/20">
            <ol className="relative ml-2 border-l md:ml-4 border-border">
              {/* Step 1 - Design Postcard */}
              <li className="relative pl-6 md:pl-8 py-6">
                <span className="absolute -left-3 md:-left-4 top-6 inline-flex h-8 w-8 items-center justify-center rounded-full border bg-card text-foreground shadow-sm">
                  1
                </span>
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <p className="font-medium">Design Postcard</p>
                    <div className="mt-3 flex gap-3">
                      {/* Design Card Button */}
                      <DesignPostcardDialog currentUserId={currentUserId} />

                      {/* Preview Button */}
                      <PreviewPostcardDialog currentUserId={currentUserId} />
                    </div>
                  </div>
                </div>
              </li>

              {/* Step 2 - Add Billing */}
              <li className="relative pl-6 md:pl-8 py-6">
                <span className="absolute -left-3 md:-left-4 top-6 inline-flex h-8 w-8 items-center justify-center rounded-full border bg-card text-foreground shadow-sm">
                  2
                </span>
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <p className="font-medium">Add Billing</p>
                    <div className="mt-3">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm">Add Billing</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle>Add Billing Information</DialogTitle>
                            <DialogDescription>
                              Set up your billing information to start sending thank you postcards.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 mt-4">
                            {/* Subscription Plan Selection */}
                            <div className="space-y-3">
                              <Label>Select Subscription Plan</Label>
                              <TooltipProvider>
                                 <ToggleGroup 
                                   type="single" 
                                   value={selectedPlan} 
                                   onValueChange={(value) => setSelectedPlan(value || "free")}
                                   variant="card"
                                   className="grid grid-cols-2 gap-3"
                                 >
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <ToggleGroupItem 
                                        value="free" 
                                        className="flex flex-col items-start p-4 h-auto text-left border-2 border-muted bg-card data-[state=on]:border-primary data-[state=on]:bg-primary/5 data-[state=on]:shadow-md data-[state=on]:ring-2 data-[state=on]:ring-primary/20 hover:bg-muted/30 transition-all duration-200 cursor-pointer"
                                      >
                                        <div className="font-semibold">Pay as You Go</div>
                                        <div className="text-2xl font-bold">$50</div>
                                        <div className="text-sm text-muted-foreground">initial charge</div>
                                      </ToggleGroupItem>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-[280px]">
                                       <div className="space-y-1">
                                        <p className="font-semibold">Pay as You Go Plan:</p>
                                        <ul className="text-sm space-y-1">
                                          <li className="flex items-center gap-2">
                                            <Info className="h-3 w-3 text-blue-600 shrink-0" strokeWidth={2.5} />
                                            <span className="font-medium">$50 charge on activation & when balance &lt; $10</span>
                                          </li>
                                          <li className="flex items-center gap-2">
                                            <Check className="h-3 w-3 text-green-600 shrink-0" strokeWidth={2.5} />
                                            <span>$1.99 per postcard sent</span>
                                          </li>
                                          <li className="flex items-center gap-2">
                                            <Check className="h-3 w-3 text-green-600 shrink-0" strokeWidth={2.5} />
                                            <span>6x9 postcards</span>
                                          </li>
                                          <li className="flex items-center gap-2">
                                            <Check className="h-3 w-3 text-green-600 shrink-0" strokeWidth={2.5} />
                                            <span>Standard class mail (7-10 business days)</span>
                                          </li>
                                          <li className="flex items-center gap-2">
                                            <Check className="h-3 w-3 text-green-600 shrink-0" strokeWidth={2.5} />
                                            <span>Basic branding options</span>
                                          </li>
                                          <li className="flex items-center gap-2">
                                            <Check className="h-3 w-3 text-green-600 shrink-0" strokeWidth={2.5} />
                                            <span>Email support</span>
                                          </li>
                                          <li className="flex items-center gap-2">
                                            <X className="h-3 w-3 text-red-600 shrink-0" strokeWidth={2.5} />
                                            <span>Remove Thank Donors branding</span>
                                          </li>
                                        </ul>
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                  
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <ToggleGroupItem 
                                        value="pro" 
                                        className="flex flex-col items-start p-4 h-auto text-left border-2 border-muted bg-card data-[state=on]:border-primary data-[state=on]:bg-primary/5 data-[state=on]:shadow-md data-[state=on]:ring-2 data-[state=on]:ring-primary/20 hover:bg-muted/30 transition-all duration-200 cursor-pointer"
                                      >
                                        <div className="font-semibold">Pro</div>
                                         <div className="text-2xl font-bold">$99</div>
                                         <div className="text-sm text-muted-foreground">per month (7-day free trial)</div>
                                      </ToggleGroupItem>
                                    </TooltipTrigger>
                                     <TooltipContent side="top" className="max-w-[280px]">
                                       <div className="space-y-1">
                                         <p className="font-semibold">Pro Plan Includes:</p>
                                         <ul className="text-sm space-y-1">
                                           <li className="flex items-center gap-2">
                                             <Check className="h-3 w-3 text-green-600 shrink-0" strokeWidth={2.5} />
                                             <span>$0.99 per postcard (50% savings)</span>
                                           </li>
                                           <li className="flex items-center gap-2">
                                             <Check className="h-3 w-3 text-green-600 shrink-0" strokeWidth={2.5} />
                                             <span>6x9 postcards</span>
                                           </li>
                                           <li className="flex items-center gap-2">
                                             <Check className="h-3 w-3 text-green-600 shrink-0" strokeWidth={2.5} />
                                             <span>First class mail (3-5 business days)</span>
                                           </li>
                                           <li className="flex items-center gap-2">
                                             <Check className="h-3 w-3 text-green-600 shrink-0" strokeWidth={2.5} />
                                             <span>Custom branding options</span>
                                           </li>
                                           <li className="flex items-center gap-2">
                                             <Check className="h-3 w-3 text-green-600 shrink-0" strokeWidth={2.5} />
                                             <span>Email and Phone support</span>
                                           </li>
                                           <li className="flex items-center gap-2">
                                             <Check className="h-3 w-3 text-green-600 shrink-0" strokeWidth={2.5} />
                                             <span>Remove Thank Donors branding</span>
                                           </li>
                                         </ul>
                                       </div>
                                     </TooltipContent>
                                  </Tooltip>
                                </ToggleGroup>
                              </TooltipProvider>
                            </div>
                            
                             <div className="space-y-4">
                               <div className="bg-secondary/20 border border-secondary/40 rounded-lg p-4">
                                 <div className="font-medium mb-2">Plan Summary:</div>
                                 {selectedPlan === "free" ? (
                                   <div className="text-sm space-y-1">
                                     <div>✓ Free monthly subscription</div>
                                     <div>✓ $1.99 per mailing</div>
                                     <div>✓ Standard class mail delivery</div>
                                   </div>
                                 ) : (
                                   <div className="text-sm space-y-1">
                                     <div>✓ $99/month after 7-day free trial</div>
                                     <div>✓ $0.99 per mailing (save $1.00 per mailing!)</div>
                                     <div>✓ Priority features and support</div>
                                   </div>
                                 )}
                               </div>
                             </div>
                             <div className="flex items-center justify-end space-x-2 pt-4">
                               <Button variant="outline">Cancel</Button>
                               <Button 
                                 onClick={async () => {
                                   try {
                                     const planId = selectedPlan === "free" ? 1 : 2;
                                     const { data, error } = await supabase.functions.invoke('create-checkout-session', {
                                       body: { planId }
                                     });
                                     
                                     if (error) throw error;
                                     
                                     if (data.redirect_url) {
                                       // For free plan, redirect directly
                                       window.location.href = data.redirect_url;
                                     } else if (data.url) {
                                       // For pro plan, open Stripe checkout
                                       window.open(data.url, '_blank');
                                     }
                                   } catch (error) {
                                     console.error('Error creating checkout session:', error);
                                     toast.error('Failed to start checkout process');
                                   }
                                 }}
                               >
                                 {selectedPlan === "free" ? "Set Up Pay as You Go" : "Start 7-Day Free Trial"}
                               </Button>
                             </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              </li>

              {/* Step 3 - Add ActBlue */}
              <li className="relative pl-6 md:pl-8 py-6">
                <span className="absolute -left-3 md:-left-4 top-6 inline-flex h-8 w-8 items-center justify-center rounded-full border bg-card text-foreground shadow-sm">
                  3
                </span>
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <p className="font-medium">Connect ActBlue</p>
                    <div className="mt-3">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm">Connect</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-auto">
                          <DialogHeader>
                            <DialogTitle>Add ActBlue account</DialogTitle>
                            <DialogDescription>
                              Your ActBlue donors will be mailed thank you postcards for donations received under this account.
                            </DialogDescription>
                          </DialogHeader>
                          <Tabs defaultValue="instructions" className="mt-4">
                            <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger value="instructions">Instructions</TabsTrigger>
                              <TabsTrigger value="webhook">Webhook Details</TabsTrigger>
                            </TabsList>
                            <TabsContent value="instructions" className="space-y-4 pt-4 min-h-[280px]">
                              <article className="prose prose-sm max-w-none text-foreground">
                                <ol className="list-decimal pl-5 space-y-2 text-sm">
                                  <li>Click Integrations on the left-hand sidebar.</li>
                                  <li>Click Manage under the Webhooks section.</li>
                                  <li>Click Request a New Webhook.</li>
                                  <li>Select ActBlue Default in the dropdown menu, then click Next.</li>
                                  <li>Copy and paste the details into the corresponding fields, then click Submit Request.</li>
                                </ol>
                              </article>
                              <p className="text-sm text-muted-foreground">
                                Our system receives donation data within 48 hours of new webhook submissions to ActBlue.
                              </p>
                            </TabsContent>
                            <TabsContent value="webhook" className="space-y-4 pt-4 min-h-[280px]">
                              {loadingWebhook ? (
                                <div className="text-center py-8">
                                  <p className="text-sm text-muted-foreground">Webhook creation pending...</p>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  <CopyField id="endpoint" label="Endpoint URL" value={actblueEndpoint} type="url" />
                                  <CopyField id="username" label="Username" value={actblueUsername} />
                                  <CopyField id="password" label="Password" value={fetchingPassword ? 'Loading password...' : actbluePassword} type="password" />
                                </div>
                              )}
                            </TabsContent>
                          </Tabs>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              </li>
            </ol>
          </nav>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1">
          <div className="p-6 pr-0">
            <DonationsTable />
          </div>
        </div>
      </main>
    </div>;
};
export default Index;
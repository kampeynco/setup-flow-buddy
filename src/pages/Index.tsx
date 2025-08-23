import { useEffect, useMemo, useRef, useState } from "react";
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
import PostcardPreview from "@/components/PostcardPreview";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import SettingsDialog from "@/components/SettingsDialog";
import { DonationsTable } from "@/components/DonationsTable";
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

  // Address form state
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [committeeName, setCommitteeName] = useState("");
  const [street, setStreet] = useState("");
  const [unitAddr, setUnitAddr] = useState("");
  const [cityName, setCityName] = useState("");
  const [region, setRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);

  // Billing state
  const [selectedPlan, setSelectedPlan] = useState("free");
  const [billingDialogOpen, setBillingDialogOpen] = useState(false);

  // Session timeout state
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds

  const handleSignOut = async () => {
    try {
      cleanupAuthState();
      try { await supabase.auth.signOut({ scope: 'global' }); } catch {}
    } finally {
      window.location.href = "/auth";
    }
  };

  // Session timeout management
  const startSessionTimeout = () => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      toast.info("Session expired due to inactivity");
      handleSignOut();
    }, SESSION_TIMEOUT);
  };

  const resetSessionTimeout = () => {
    startSessionTimeout();
  };

  // Activity event listeners to reset timeout
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const resetTimeout = () => {
      resetSessionTimeout();
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, resetTimeout, true);
    });

    // Start initial timeout
    startSessionTimeout();

    return () => {
      // Clean up event listeners
      events.forEach(event => {
        document.removeEventListener(event, resetTimeout, true);
      });
      
      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
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
        .select('id, webhook_url, webhook_password')
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
          .select('id, webhook_url, webhook_password')
          .eq('id', userId)
          .maybeSingle();
        profile = refetched || null;
      }

      if (!profile?.webhook_url || !profile?.webhook_password) {
        if (!userEmail) {
          toast.error('Missing account email. Please sign out and sign back in.');
          setLoadingWebhook(false);
          return;
        }
        toast.info('Creating your ActBlue webhook...');
        const { data: fnData, error: fnError } = await supabase.functions.invoke('create-hookdeck-webhook', {
          body: {
            user_id: userId,
            email: userEmail,
          },
        });
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
          .select('webhook_url, webhook_password')
          .eq('id', userId)
          .maybeSingle();
        setActblueEndpoint(after?.webhook_url || '');
        setActbluePassword(after?.webhook_password || '');
      } else {
        setActblueEndpoint(profile.webhook_url || '');
        setActbluePassword(profile.webhook_password || '');
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

  // Signature editor state (Back tab)
  const [includeSignature, setIncludeSignature] = useState(false);
  const [signatureMode, setSignatureMode] = useState<"draw" | "type" | "upload" | null>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState("#000000");
  const [typedSignature, setTypedSignature] = useState("Your Name");
  const [typedFont, setTypedFont] = useState<"cursive" | "serif" | "sans-serif">("cursive");
  const [typedSize, setTypedSize] = useState(32);
  const [uploadedSignature, setUploadedSignature] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const CANVAS_W = 480;
  const CANVAS_H = 160;
  const initCanvas = () => {
    const c = drawCanvasRef.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = Math.floor(CANVAS_W * dpr);
    c.height = Math.floor(CANVAS_H * dpr);
    c.style.width = CANVAS_W + "px";
    c.style.height = CANVAS_H + "px";
    const ctx = c.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = 2;
      ctx.strokeStyle = penColor;
    }
  };

  useEffect(() => {
    if (signatureMode === "draw") {
      initCanvas();
    }
  }, [signatureMode]);

  const handlePointer = (type: "down" | "move" | "up") => (e: any) => {
    if (signatureMode !== "draw") return;
    const c = drawCanvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const rect = c.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (type === "down") {
      setIsDrawing(true);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.strokeStyle = penColor;
      ctx.lineWidth = 2;
    } else if (type === "move" && isDrawing) {
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (type === "up") {
      if (isDrawing) {
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.closePath();
      }
      setIsDrawing(false);
      setSignaturePreview(c.toDataURL("image/png"));
    }
  };

  const clearCanvas = () => {
    const c = drawCanvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    setSignaturePreview(null);
  };

  const handleUpload = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const data = reader.result as string;
      setUploadedSignature(data);
      setSignaturePreview(data);
    };
    reader.readAsDataURL(file);
  };
  return <div className="min-h-screen">
      <header className="sticky top-0 z-50 bg-primary border-b">
        <div className="mx-auto max-w-[1024px] px-4 sm:px-6 lg:px-0 py-3 flex items-center justify-between">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 bg-card text-primary hover:bg-card/90">
                <Avatar className="h-6 w-6">
                  <AvatarFallback>L</AvatarFallback>
                </Avatar>
                Account
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="z-50 bg-popover">
              <DropdownMenuItem onSelect={() => setSettingsOpen(true)}>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleSignOut}>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button className="bg-card text-primary hover:bg-card/90">Get Free Month</Button>
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
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm">Design</Button>
                        </DialogTrigger>
                     <DialogContent className="sm:max-w-[720px] sm:h-[640px] flex flex-col">
                          <DialogHeader className="flex-shrink-0">
                            <DialogTitle>Design Postcard</DialogTitle>
                            <DialogDescription>
                              Configure your postcard template. Switch between Front and Back, adjust design options, and compose the default thank-you message.
                            </DialogDescription>
                          </DialogHeader>
                          <Tabs defaultValue="image" className="flex gap-4 flex-1 min-h-0">
                            <TabsList className="flex flex-col h-fit self-start flex-shrink-0">
                              <TabsTrigger value="image" className="w-full justify-start">Image</TabsTrigger>
                              <TabsTrigger value="bgcolor" className="w-full justify-start">BG Color</TabsTrigger>
                              <TabsTrigger value="message" className="w-full justify-start">Message</TabsTrigger>
                              <TabsTrigger value="draw" className="w-full justify-start">Draw</TabsTrigger>
                              <TabsTrigger value="typed" className="w-full justify-start">Typed</TabsTrigger>
                              <TabsTrigger value="upload" className="w-full justify-start">Upload</TabsTrigger>
                            </TabsList>
                            
                            <div className="flex-1 overflow-auto min-h-0">
                              <TabsContent value="image" className="mt-0 h-full">
                                <div className="space-y-4">
                                  <div className="flex items-center gap-4">
                                    <Label className="w-48">Background Image</Label>
                                    <Input type="file" accept="image/png, image/svg+xml" className="max-w-xs" />
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 w-48">
                                      <Label>Background Size</Label>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p><strong>Center Contain:</strong> Centers the logo on the front of the postcard</p>
                                          <p><strong>Full Cover:</strong> Covers the entire front of the postcard</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </div>
                                    <Select>
                                      <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Select size" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="contain">Center Contain</SelectItem>
                                        <SelectItem value="cover">Full Cover</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </TabsContent>
                              <TabsContent value="bgcolor" className="mt-0 h-full">
                                <div className="space-y-4">
                                  <div className="flex items-center gap-4">
                                    <Label htmlFor="front-bg-color" className="w-48">Front background color</Label>
                                    <Input id="front-bg-color" type="color" aria-label="Choose front background color" className="h-10 w-12 p-1" />
                                  </div>
                                </div>
                              </TabsContent>
                              <TabsContent value="message" className="mt-0 h-full">
                                <div className="space-y-4 max-w-md">
                                  <div className="space-y-2">
                                    <Label htmlFor="postcard-message">Message</Label>
                                    <Textarea id="postcard-message" placeholder="Write your postcard message..." rows={6} />
                                  </div>
                                </div>
                              </TabsContent>
                              <TabsContent value="draw" className="mt-0 h-full">
                                <div className="space-y-4">
                                  <div className="flex items-center gap-2">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="flex items-center gap-2">
                                          <Checkbox
                                            id="add-draw-signature"
                                            checked={includeSignature && signatureMode === "draw"}
                                            disabled={includeSignature && signatureMode !== "draw"}
                                            onCheckedChange={(v) => { 
                                              const enabled = Boolean(v); 
                                              if (enabled) {
                                                setIncludeSignature(true);
                                                setSignatureMode("draw");
                                              } else {
                                                setIncludeSignature(false);
                                                setSignatureMode(null);
                                              }
                                            }}
                                          />
                                          <Label htmlFor="add-draw-signature">Add Draw Signature</Label>
                                        </div>
                                      </TooltipTrigger>
                                      {includeSignature && signatureMode !== "draw" && (
                                        <TooltipContent>
                                          <p>Only one signature type can be enabled at a time.</p>
                                          <p>Disable the current signature to select this option.</p>
                                        </TooltipContent>
                                      )}
                                    </Tooltip>
                                  </div>

                                  {includeSignature && signatureMode === "draw" && (
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-4">
                                        <Label htmlFor="pen-color" className="w-48">Pen color</Label>
                                        <Input id="pen-color" type="color" value={penColor} onChange={(e) => setPenColor(e.target.value)} className="h-10 w-12 p-1" />
                                        <Button type="button" variant="secondary" onClick={clearCanvas}>Clear</Button>
                                      </div>
                                      <div className="rounded-md border bg-background p-2">
                                        <canvas
                                          ref={drawCanvasRef}
                                          className="w-full max-w-full touch-none"
                                          onPointerDown={handlePointer("down")}
                                          onPointerMove={handlePointer("move")}
                                          onPointerUp={handlePointer("up")}
                                          onPointerLeave={handlePointer("up")}
                                        />
                                      </div>
                                      {signaturePreview && (
                                        <div className="space-y-2">
                                          <Label className="block">Signature preview</Label>
                                          <div className="rounded-md border bg-card p-3">
                                            <img src={signaturePreview} alt="Signature preview image" className="h-16 w-auto object-contain" loading="lazy" />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </TabsContent>
                              <TabsContent value="typed" className="mt-0 h-full">
                                <div className="space-y-4">
                                  <div className="flex items-center gap-2">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="flex items-center gap-2">
                                          <Checkbox
                                            id="add-typed-signature"
                                            checked={includeSignature && signatureMode === "type"}
                                            disabled={includeSignature && signatureMode !== "type"}
                                            onCheckedChange={(v) => { 
                                              const enabled = Boolean(v); 
                                              if (enabled) {
                                                setIncludeSignature(true);
                                                setSignatureMode("type");
                                              } else {
                                                setIncludeSignature(false);
                                                setSignatureMode(null);
                                              }
                                            }}
                                          />
                                          <Label htmlFor="add-typed-signature">Add Typed Signature</Label>
                                        </div>
                                      </TooltipTrigger>
                                      {includeSignature && signatureMode !== "type" && (
                                        <TooltipContent>
                                          <p>Only one signature type can be enabled at a time.</p>
                                          <p>Disable the current signature to select this option.</p>
                                        </TooltipContent>
                                      )}
                                    </Tooltip>
                                  </div>

                                  {includeSignature && signatureMode === "type" && (
                                    <div className="space-y-3">
                                      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                                        <Label htmlFor="typed-signature" className="sm:w-48 shrink-0">Signature text</Label>
                                        <Input id="typed-signature" value={typedSignature} onChange={(e) => setTypedSignature(e.target.value)} className="w-full sm:flex-1 min-w-0 max-w-full" />
                                      </div>
                                      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                                        <Label className="sm:w-48 shrink-0">Font</Label>
                                        <Select value={typedFont} onValueChange={(v) => setTypedFont(v as any)}>
                                          <SelectTrigger className="w-full sm:w-[200px] min-w-0"><SelectValue placeholder="Choose font" /></SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="cursive">Cursive</SelectItem>
                                            <SelectItem value="serif">Serif</SelectItem>
                                            <SelectItem value="sans-serif">Sans-serif</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                                        <Label className="sm:w-48 shrink-0">Size</Label>
                                        <div className="w-full sm:w=[240px] min-w-0">
                                          <Slider value={[typedSize]} min={16} max={40} step={1} onValueChange={(v) => setTypedSize(v[0])} />
                                        </div>
                                        <span className="text-sm text-muted-foreground">{typedSize}px</span>
                                      </div>
                                      <div className="space-y-2">
                                        <Label className="block">Signature preview</Label>
                                        <div className="rounded-md border bg-card p-3">
                                          <div
                                            className="max-w-full truncate flex items-center h-14"
                                            style={{
                                              fontFamily: typedFont,
                                              fontSize: typedSize,
                                              lineHeight: 1,
                                            }}
                                          >
                                            {typedSignature}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </TabsContent>
                              <TabsContent value="upload" className="mt-0 h-full">
                                <div className="space-y-4">
                                  <div className="flex items-center gap-2">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="flex items-center gap-2">
                                          <Checkbox
                                            id="add-upload-signature"
                                            checked={includeSignature && signatureMode === "upload"}
                                            disabled={includeSignature && signatureMode !== "upload"}
                                            onCheckedChange={(v) => { 
                                              const enabled = Boolean(v); 
                                              if (enabled) {
                                                setIncludeSignature(true);
                                                setSignatureMode("upload");
                                              } else {
                                                setIncludeSignature(false);
                                                setSignatureMode(null);
                                              }
                                            }}
                                          />
                                          <Label htmlFor="add-upload-signature">Add Upload Signature</Label>
                                        </div>
                                      </TooltipTrigger>
                                      {includeSignature && signatureMode !== "upload" && (
                                        <TooltipContent>
                                          <p>Only one signature type can be enabled at a time.</p>
                                          <p>Disable the current signature to select this option.</p>
                                        </TooltipContent>
                                      )}
                                    </Tooltip>
                                  </div>

                                  {includeSignature && signatureMode === "upload" && (
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-4 min-w-0">
                                        <Label htmlFor="signature-upload" className="w-48">Upload image</Label>
                                        <div className="flex items-center gap-2 min-w-0">
                                          <Input
                                            id="signature-upload"
                                            type="file"
                                            accept="image/png,image/jpeg"
                                            onChange={handleUpload}
                                            className="max-w-xs"
                                            ref={uploadInputRef}
                                          />
                                          {uploadedFileName && (
                                            <div className="flex items-center gap-1 min-w-0">
                                              <span
                                                className="truncate text-sm text-muted-foreground max-w-[200px]"
                                                title={uploadedFileName}
                                              >
                                                {uploadedFileName}
                                              </span>
                                              <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                aria-label="Remove uploaded file"
                                                title="Remove uploaded file"
                                                onClick={() => {
                                                  setUploadedSignature(null);
                                                  setSignaturePreview(null);
                                                  setUploadedFileName(null);
                                                  if (uploadInputRef.current) {
                                                    uploadInputRef.current.value = "";
                                                    uploadInputRef.current.focus();
                                                  }
                                                }}
                                              >
                                                <X className="h-4 w-4" />
                                              </Button>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      {signaturePreview && (
                                        <div className="space-y-2">
                                          <Label className="block">Signature preview</Label>
                                          <div className="rounded-md border bg-card p-3">
                                            <img src={signaturePreview} alt="Signature preview image" className="h-16 w-auto object-contain" loading="lazy" />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </TabsContent>
                            </div>
                          </Tabs>
                          <div className="sticky bottom-0 border-t border-border bg-background px-4 py-3 flex items-center justify-end flex-shrink-0">
                            <Button onClick={() => toast.success("Design saved (demo)")} size="sm">Save</Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {/* Preview Button */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">Preview</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[960px] h-[85vh] max-h-[90vh] overflow-auto">
                          <DialogHeader className="sr-only">
                            <DialogTitle>Preview Thank You Postcard</DialogTitle>
                            <DialogDescription>6×9 template preview</DialogDescription>
                          </DialogHeader>
                          <PostcardPreview />
                        </DialogContent>
                      </Dialog>
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
                                        <div className="font-semibold">Free</div>
                                        <div className="text-2xl font-bold">$0</div>
                                        <div className="text-sm text-muted-foreground">forever</div>
                                      </ToggleGroupItem>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-[280px]">
                                      <div className="space-y-1">
                                        <p className="font-semibold">Free Plan Includes:</p>
                                        <ul className="text-sm space-y-1">
                                          <li className="flex items-center gap-2">
                                            <Check className="h-3 w-3 text-green-600 shrink-0" strokeWidth={2.5} />
                                            <span>$1.99 per postcard</span>
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
                                        <div className="text-sm text-muted-foreground">per month</div>
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
                            
                            <div className="grid gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="billing-name">Cardholder Name</Label>
                                <Input id="billing-name" placeholder="Full name on card" />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="card-number">Card Number</Label>
                                <Input id="card-number" placeholder="1234 5678 9012 3456" />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="expiry">Expiry Date</Label>
                                  <Input id="expiry" placeholder="MM/YY" />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="cvc">CVC</Label>
                                  <Input id="cvc" placeholder="123" />
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-end space-x-2 pt-4">
                              <Button variant="outline">Cancel</Button>
                              <Button onClick={() => toast.success("Billing information saved (demo)")}>
                                Save Billing Info
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
                                  <CopyField id="password" label="Password" value={actbluePassword} type="password" />
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
        <div className="flex-1 p-6">
          <DonationsTable />
        </div>
      </main>
    </div>;
};
export default Index;
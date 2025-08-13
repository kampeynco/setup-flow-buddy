import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Copy, Check, Eye, EyeOff, ChevronDown, X } from "lucide-react";
import { toast } from "sonner";
import PostcardPreview from "@/components/PostcardPreview";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SettingsDialog from "@/components/SettingsDialog";
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
  { id: 3, title: "Thank Donors", cta: "Preview Card", note: undefined }
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

  const handleSignOut = async () => {
    try {
      cleanupAuthState();
      try { await supabase.auth.signOut({ scope: 'global' }); } catch {}
    } finally {
      window.location.href = "/auth";
    }
  };

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
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
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
              {steps.map((s, idx) => <li key={s.id} className="relative pl-6 md:pl-8 py-6">
                  <span className="absolute -left-3 md:-left-4 top-6 inline-flex h-8 w-8 items-center justify-center rounded-full border bg-card text-foreground shadow-sm">
                    {s.id}
                  </span>
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <p className="font-medium">{s.title}</p>
                      {s.note}

                      <div className="mt-3">
                        {/* Step dialogs */}
                        {s.id === 1 && (
                          <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
                            <DialogTrigger asChild>
                              <Button size="sm">{s.cta}</Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Add Committee Address</DialogTitle>
                                <DialogDescription>
                                  This will be used as the return address for undeliverable postcards.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                  <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2 md:col-span-2">
                                      <Label>Legal Committee Name</Label>
                                      <Input placeholder="Committee Name" value={committeeName} onChange={(e) => setCommitteeName(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Street</Label>
                                      <Input placeholder="123 Main St" value={street} onChange={(e) => setStreet(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Unit</Label>
                                      <Input placeholder="Suite 100" value={unitAddr} onChange={(e) => setUnitAddr(e.target.value)} />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                      <Label>City</Label>
                                      <Input placeholder="Anytown" value={cityName} onChange={(e) => setCityName(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>State</Label>
                                      <Input placeholder="CA" value={region} onChange={(e) => setRegion(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>ZIP</Label>
                                      <Input placeholder="90210" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
                                    </div>
                                  </div>
                                  <Button onClick={handleSaveAddress} disabled={savingAddress}>
                                    {savingAddress ? 'Saving...' : 'Save Address'}
                                  </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}

                        {s.id === 2 && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm">{s.cta}</Button>
                            </DialogTrigger>
                        <DialogContent className="max-h-[85vh] overflow-auto pb-0">
                              <DialogHeader>
                                <DialogTitle>Design Postcard</DialogTitle>
                                <DialogDescription>
                                  Configure your postcard template. Switch between Front and Back, adjust design options, and compose the default thank-you message.
                                </DialogDescription>
                              </DialogHeader>
                              <Tabs defaultValue="front" className="mt-2">
                                <TabsList>
                                  <TabsTrigger value="front">Front</TabsTrigger>
                                  <TabsTrigger value="back">Back</TabsTrigger>
                                </TabsList>
                                <TabsContent value="front" className="space-y-4 pt-4">
                                  <div className="flex items-center gap-4">
                                    <Label className="w-48">Committee Logo</Label>
                                    <Input type="file" accept="image/png, image/svg+xml" className="max-w-xs" />
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <Label htmlFor="front-bg-color" className="w-48">Front background color</Label>
                                    <Input id="front-bg-color" type="color" aria-label="Choose front background color" className="h-10 w-12 p-1" />
                                  </div>
                                </TabsContent>
                                <TabsContent value="back" className="space-y-4 pt-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="postcard-message">Message</Label>
                                    <Textarea id="postcard-message" placeholder="Write your postcard message..." rows={6} />

                                    <div className="flex items-center gap-2">
                                      <Checkbox
                                        id="add-signature"
                                        checked={includeSignature}
                                        onCheckedChange={(v) => { const enabled = Boolean(v); setIncludeSignature(enabled); if (enabled) { setSignatureMode("draw"); } }}
                                      />
                                      <Label htmlFor="add-signature">Add Signature</Label>
                                    </div>

                                    {includeSignature && (
                                      <div className="mt-2 space-y-4 rounded-md border p-4">
                                        <div>
                                          
                                          <ToggleGroup
                                            type="single"
                                            value={signatureMode ?? undefined}
                                            onValueChange={(val) => {
                                              const next = (val as "draw" | "type" | "upload") || null;
                                              setSignatureMode(next);
                                              setSignaturePreview(null);
                                              setUploadedSignature(null);
                                              setUploadedFileName(null);
                                              if (uploadInputRef.current) uploadInputRef.current.value = "";
                                              if (next !== "draw") {
                                                clearCanvas();
                                              }
                                            }}
                                            className="flex flex-wrap gap-2"
                                          >
                                            <ToggleGroupItem value="draw" aria-label="Draw signature" className="px-4 py-6">
                                              Draw Signature
                                            </ToggleGroupItem>
                                            <ToggleGroupItem value="type" aria-label="Type signature" className="px-4 py-6">
                                              Type Signature
                                            </ToggleGroupItem>
                                            <ToggleGroupItem value="upload" aria-label="Upload signature" className="px-4 py-6">
                                              Upload Signature
                                            </ToggleGroupItem>
                                          </ToggleGroup>
                                        </div>

                                        {signatureMode === "draw" && (
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
                                          </div>
                                        )}

                                        {signatureMode === "type" && (
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
                                          </div>
                                        )}

                                        {signatureMode === "upload" && (
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
                                          </div>
                                        )}

                                    {/* Live preview */}
                                    {signatureMode && (
                                      <div className="space-y-2">
                                        <Label className="block">Signature preview</Label>
                                        <div className="rounded-md border bg-card p-3">
                                          {signatureMode === "type" ? (
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
                                          ) : signaturePreview ? (
                                            <img src={signaturePreview} alt="Signature preview image" className="h-16 w-auto object-contain" loading="lazy" />
                                          ) : (
                                            <p className="text-sm text-muted-foreground">No signature yet. Use a method above to create or upload one.</p>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                      </div>
                                    )}
                                  </div>
                                </TabsContent>
                              </Tabs>
                              <div className="sticky bottom-0 border-t border-border bg-background px-4 py-3 flex items-center justify-end">
                                <Button onClick={() => toast.success("Design saved (demo)")} size="sm">Save</Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}

                        {s.id === 3 && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm">{s.cta}</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[960px] h-[85vh] max-h-[90vh] overflow-auto">
                              <DialogHeader className="sr-only">
                                <DialogTitle>Preview Thank You Postcard</DialogTitle>
                                <DialogDescription>6×9 template preview</DialogDescription>
                              </DialogHeader>
                              <PostcardPreview />
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                  </div>
                </li>)}
            </ol>
          </nav>
        </aside>

        <section id="actblue">
          <Card className="shadow-sm w-full md:w-[484px] md:min-h-[454px] md:mx-auto lg:mx-0">
            <CardHeader>
              <h1 className="text-2xl font-semibold">Add ActBlue account</h1>
            </CardHeader>
            <CardContent className="space-y-6">
              <article className="prose prose-sm max-w-none text-foreground">
                <p className="text-sm text-muted-foreground">
                  Your ActBlue donors will be mailed thank you postcards for donations received under this account.
                </p>
                <ol className="list-decimal pl-5 space-y-2 text-sm pt-8">
                  <li>Click Integrations on the left-hand sidebar.</li>
                  <li>Click Manage under the Webhooks section.</li>
                  <li>Click Request a New Webhook.</li>
                  <li>Select ActBlue Default in the dropdown menu, then click Next.</li>
                  <li>Copy and paste the details into the corresponding fields, then click Submit Request.</li>
                </ol>
              </article>

{showSecrets && (
              <div className="grid gap-4">
                <CopyField id="endpoint" label="Endpoint URL" value={actblueEndpoint} type="url" />
                <CopyField id="username" label="Username" value={actblueUsername} />
                <CopyField id="password" label="Password" value={actbluePassword} type="password" />
              </div>
              )}


              <div className="flex items-center gap-3">
                {loadingWebhook ? (
                  <Button className="w-full" variant="secondary" disabled>
                    Webhook creation pending...
                  </Button>
                ) : (
                  <Button className="w-full" onClick={() => setShowSecrets(s => !s)}>
                    {showSecrets ? (
                      <span className="inline-flex items-center gap-2"><EyeOff className="h-4 w-4" /> Hide ActBlue Details</span>
                    ) : (
                      <span className="inline-flex items-center gap-2"><Eye className="h-4 w-4" /> Show ActBlue Details</span>
                    )}
                  </Button>
                )}
              </div>
              <p className="mt-2 text-sm text-muted-foreground text-center">
                Our system receives donation data within 48 hours of new webhook submissions to ActBlue.
              </p>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>;
};
export default Index;
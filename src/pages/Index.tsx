import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Copy, Check, Eye, EyeOff, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import PostcardPreview from "@/components/PostcardPreview";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const endpoint = useMemo(() => "https://actblue.thanksfromus.com/ht6d30z3d43yf9", []);
  const username = useMemo(() => "lenox@kampeyn.com", []);
  const password = useMemo(() => "yay4a7ahe7tucygf", []);

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
    const reader = new FileReader();
    reader.onload = () => {
      const data = reader.result as string;
      setUploadedSignature(data);
      setSignaturePreview(data);
    };
    reader.readAsDataURL(file);
  };
  return <div className="min-h-screen">
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="mx-auto max-w-[1024px] py-3 flex items-center justify-between bg-background">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
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
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button>Send Thanks</Button>
        </div>
      </header>

      <main className="mx-auto max-w-[1024px] py-8 grid gap-12 md:grid-cols-[488px_1fr]">
        <aside className="bg-transparent">
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
                          <Dialog>
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
                                    <Input placeholder="Committee Name" />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Street</Label>
                                    <Input placeholder="123 Main St" />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Unit</Label>
                                    <Input placeholder="Suite 100" />
                                  </div>
                                  <div className="space-y-2 md:col-span-2">
                                    <Label>City</Label>
                                    <Input placeholder="Anytown" />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>State</Label>
                                    <Input placeholder="CA" />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>ZIP</Label>
                                    <Input placeholder="90210" />
                                  </div>
                                </div>
                                <Button onClick={() => toast.success("Address saved (demo)")}>
                                  Save Address
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
                        <DialogContent className="max-h-[85vh] overflow-auto">
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
                                        onCheckedChange={(v) => setIncludeSignature(Boolean(v))}
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
                                                <Slider value={[typedSize]} min={16} max={96} step={1} onValueChange={(v) => setTypedSize(v[0])} />
                                              </div>
                                              <span className="text-sm text-muted-foreground">{typedSize}px</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                              <Button type="button" variant="secondary" onClick={() => { setTypedSignature(""); setTypedFont("cursive"); setTypedSize(32); }}>
                                                Reset
                                              </Button>
                                            </div>
                                          </div>
                                        )}

                                        {signatureMode === "upload" && (
                                          <div className="space-y-3">
                                            <div className="flex items-center gap-4">
                                              <Label htmlFor="signature-upload" className="w-48">Upload image</Label>
                                              <Input id="signature-upload" type="file" accept="image/png,image/jpeg" onChange={handleUpload} className="max-w-xs" />
                                            </div>
                                            <div className="flex items-center gap-3">
                                              <Button type="button" variant="secondary" onClick={() => { setUploadedSignature(null); setSignaturePreview(null); }}>
                                                Remove upload
                                              </Button>
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
                                              className="max-w-full truncate"
                                              style={{
                                                fontFamily: typedFont,
                                                fontSize: typedSize,
                                              }}
                                            >
                                              {typedSignature}
                                            </div>
                                          ) : signaturePreview ? (
                                            <img src={signaturePreview} alt="Signature preview" className="h-16 w-auto object-contain" />
                                          ) : (
                                            <p className="text-sm text-muted-foreground">No signature yet. Use a method above to create or upload one.</p>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                        <div className="flex flex-wrap items-center gap-3">
                                          <Button type="button" onClick={() => toast.success("Signature saved (demo)")}>Save Signature</Button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <Button onClick={() => toast.success("Message saved (demo)")} className="self-end">
                                      Save Message
                                    </Button>
                                  </div>
                                </TabsContent>
                              </Tabs>
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
          <Card className="shadow-sm w-full md:w-[484px] md:min-h-[454px]">
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
                <CopyField id="endpoint" label="Endpoint URL" value={endpoint} type="url" />
                <CopyField id="username" label="Username" value={username} />
                <CopyField id="password" label="Password" value={password} type="password" />
              </div>
              )}

              <div className="flex items-center gap-3">
                <Button className="w-full" onClick={() => setShowSecrets(s => !s)}>
                  {showSecrets ? <span className="inline-flex items-center gap-2"><EyeOff className="h-4 w-4" /> Hide ActBlue Details</span> : <span className="inline-flex items-center gap-2"><Eye className="h-4 w-4" /> Show ActBlue Details</span>}
                </Button>
              </div>
              <p className="mt-2 text-sm text-muted-foreground text-center">
                Our system will receive ActBlue donation data from your account within 48 hours. If you have alerts enabled, we will send email alerts when postcards are sent.
              </p>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>;
};
export default Index;
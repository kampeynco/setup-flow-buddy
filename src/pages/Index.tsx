import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Copy, Check, Eye, EyeOff, ChevronDown } from "lucide-react";
import { toast } from "sonner";

// Simple SEO helpers for SPA
function useSEO({ title, description }: { title: string; description: string }) {
  useEffect(() => {
    document.title = title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", description);
    else {
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
  hidden,
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

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input id={id} type={hidden && type !== "url" ? "password" : type} value={displayValue} readOnly className="pr-24" />
        <Button type="button" onClick={onCopy} variant="secondary" size="sm" className="absolute right-2 top-1/2 -translate-y-1/2">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

const steps = [
  {
    id: 1,
    title: "Upload Committee Logo",
    cta: "Upload Logo",
    note: undefined,
  },
  {
    id: 2,
    title: "Add Committee Address",
    cta: "Add Address",
    note: "this is the return address for undeliverable postcards",
  },
  {
    id: 3,
    title: "Add ActBlue account",
    cta: "Open",
    note: "see left section",
  },
  {
    id: 4,
    title: "Preview Thank You Postcard",
    cta: "Preview",
    note: undefined,
  },
];

const Index = () => {
  useSEO({
    title: "Setup Dashboard – Add ActBlue Account",
    description: "Clean, responsive dashboard to configure your account and ActBlue webhook details.",
  });

  const [showSecrets, setShowSecrets] = useState(true);

  const endpoint = useMemo(() => "https://actblue.thanksfromus.com/ht6d30z3d43yf9", []);
  const username = useMemo(() => "lenox@kampeyn.com", []);
  const password = useMemo(() => "yay4a7ahe7tucygf", []);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
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
            <DropdownMenuContent align="start">
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

      <main className="container mx-auto px-4 py-8 grid gap-8 md:grid-cols-12">
        <aside className="md:col-span-5 lg:col-span-4">
          <nav aria-label="Setup steps" className="bg-transparent">
            <ol className="relative ml-2 border-l md:ml-4 border-border">
              {steps.map((s, idx) => (
                <li key={s.id} className="relative pl-6 md:pl-8 py-6">
                  <span className="absolute -left-3 md:-left-4 top-6 inline-flex h-8 w-8 items-center justify-center rounded-full border bg-card text-foreground shadow-sm">
                    {s.id}
                  </span>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{s.title}</p>
                      {s.note && (
                        <p className="text-sm text-muted-foreground">{s.note}</p>
                      )}
                    </div>

                    {/* Step dialogs */}
                    {s.id === 1 && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm">{s.cta}</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Upload Committee Logo</DialogTitle>
                            <DialogDescription>Upload a square logo (PNG or SVG). Max 2MB.</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Input type="file" accept="image/png, image/svg+xml" />
                            <Button onClick={() => toast.success("Logo uploaded (demo)")}>Save</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}

                    {s.id === 2 && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm">{s.cta}</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Committee Address</DialogTitle>
                            <DialogDescription>This will be used as the return address for undeliverable postcards.</DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 md:grid-cols-2">
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
                          <Button onClick={() => toast.success("Address saved (demo)")}>Save Address</Button>
                        </DialogContent>
                      </Dialog>
                    )}

                    {s.id === 3 && (
                      <a href="#actblue" className="inline-flex">
                        <Button size="sm">Go to Form</Button>
                      </a>
                    )}

                    {s.id === 4 && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm">{s.cta}</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Preview Thank You Postcard</DialogTitle>
                            <DialogDescription>A quick preview of your postcard layout. (Demo)</DialogDescription>
                          </DialogHeader>
                          <div className="rounded-md border bg-card p-6 text-sm text-muted-foreground">
                            Postcard preview coming soon.
                          </div>
                          <Button onClick={() => toast.success("Preview generated (demo)")}>Generate Preview</Button>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <section id="actblue" className="md:col-span-7 lg:col-span-8">
          <Card className="shadow-sm">
            <CardHeader>
              <h1 className="text-2xl font-semibold">Add ActBlue account</h1>
            </CardHeader>
            <CardContent className="space-y-6">
              <article className="prose prose-sm max-w-none text-foreground">
                <p className="text-sm text-muted-foreground">
                  Your ActBlue donors will be mailed thank you postcards for donations received under this account.
                </p>
                <ol className="list-decimal pl-5 space-y-2 text-sm">
                  <li>Click Integrations on the left-hand sidebar.</li>
                  <li>Click Manage under the Webhooks section.</li>
                  <li>Click Request a New Webhook.</li>
                  <li>Select ActBlue Default in the dropdown menu, then click Next.</li>
                  <li>Copy and paste the details into the corresponding fields, then click Submit Request.</li>
                </ol>
              </article>

              <div className="grid gap-4">
                <CopyField id="endpoint" label="Endpoint URL" value={endpoint} type="url" hidden={!showSecrets} />
                <CopyField id="username" label="Username" value={username} hidden={!showSecrets} />
                <CopyField id="password" label="Password" value={password} type="password" hidden={!showSecrets} />
              </div>

              <div className="flex items-center gap-3">
                <Button onClick={() => setShowSecrets((s) => !s)}>
                  {showSecrets ? (
                    <span className="inline-flex items-center gap-2"><EyeOff className="h-4 w-4" /> Hide ActBlue Details</span>
                  ) : (
                    <span className="inline-flex items-center gap-2"><Eye className="h-4 w-4" /> Show ActBlue Details</span>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default Index;

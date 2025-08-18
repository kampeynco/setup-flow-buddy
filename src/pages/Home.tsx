import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import PostcardPreview from "@/components/PostcardPreview";
import { Check, Plus, Minus } from "lucide-react";
function useSEO({
  title,
  description,
  jsonLd
}: {
  title: string;
  description: string;
  jsonLd?: object;
}) {
  useEffect(() => {
    document.title = title;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", description);else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = description;
      document.head.appendChild(m);
    }
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = window.location.href;

    // JSON-LD structured data
    const existing = document.getElementById("ld-homepage");
    if (existing) existing.remove();
    if (jsonLd) {
      const s = document.createElement("script");
      s.type = "application/ld+json";
      s.id = "ld-homepage";
      s.text = JSON.stringify(jsonLd);
      document.head.appendChild(s);
    }
  }, [title, description, jsonLd]);
}
export default function Home() {
  useSEO({
    title: "Thank Donors – Automate ActBlue Thank‑You Postcards",
    description: "Connect ActBlue to Thank Donors and automatically mail branded, signed thank‑you postcards to supporters.",
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [{
        '@type': 'SoftwareApplication',
        name: 'Thank Donors',
        applicationCategory: 'MarketingAutomation',
        offers: [{
          '@type': 'Offer',
          name: 'Free',
          price: '0',
          priceCurrency: 'USD',
          description: 'Usage $1.79 per postcard. Standard class mail (up to 10 business days).'
        }, {
          '@type': 'Offer',
          name: 'Pro',
          price: '79',
          priceCurrency: 'USD',
          description: 'Usage $0.79 per postcard. First class mail (about 3 business days).'
        }]
      }, {
        '@type': 'FAQPage',
        mainEntity: [{
          '@type': 'Question',
          name: 'Do I need to export data from ActBlue?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'No. Once connected, ActBlue sends donor details directly to us automatically.'
          }
        }, {
          '@type': 'Question',
          name: 'Can I add my committee logo and return address?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. Tell us your committee name with a mailing address, share your logo, and add a personal message for your donors, all in your dashboard.'
          }
        }, {
          '@type': 'Question',
          name: 'How fast is delivery?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Our Free plan uses Standard Class (up to 10 business days). While, Pro plans use First Class (3 business days or less).'
          }
        }]
      }]
    }
  });
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return <div className="min-h-screen flex flex-col">
      <header className={`sticky top-0 z-50 border-b transition-colors ${scrolled ? "bg-card text-foreground" : "bg-primary text-primary-foreground"}`}>
        <div className="mx-auto max-w-[1024px] px-4 sm:px-6 lg:px-0 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-sans text-lg font-semibold" aria-label="Thank Donors Home">
            <img src="https://qnsodkdsjfrfjahnczwn.supabase.co/storage/v1/object/public/assets/logo_icon.svg" alt="Thank Donors logo icon" className="h-6 w-6" />
            <span>Thank Donors</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#features" className={scrolled ? "text-foreground/80 hover:text-foreground" : "text-primary-foreground/90 hover:text-primary-foreground"}>Features</a>
            <a href="#how" className={scrolled ? "text-foreground/80 hover:text-foreground" : "text-primary-foreground/90 hover:text-primary-foreground"}>How it works</a>
            <a href="#pricing" className={scrolled ? "text-foreground/80 hover:text-foreground" : "text-primary-foreground/90 hover:text-primary-foreground"}>Pricing</a>
            <a href="#faq" className={scrolled ? "text-foreground/80 hover:text-foreground" : "text-primary-foreground/90 hover:text-primary-foreground"}>FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/auth" className="hidden sm:inline-block">
              <Button variant="ghost" className={scrolled ? "" : "text-primary-foreground"}>Login</Button>
            </Link>
            <Link to="/auth?mode=signup">
              <Button variant={scrolled ? "default" : "secondary"} className="font-semibold">Start for Free</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative border-b bg-primary/5 overflow-hidden">
          {/* Grid/Dot Pattern Background */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Dot grid pattern */}
            <div className="absolute inset-0 opacity-40"
                 style={{
                   backgroundImage: `radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)`,
                   backgroundSize: '24px 24px'
                 }}></div>
            
            {/* Subtle line grid overlay */}
            <div className="absolute inset-0 opacity-20"
                 style={{
                   backgroundImage: `
                     linear-gradient(hsl(var(--primary) / 0.1) 1px, transparent 1px),
                     linear-gradient(90deg, hsl(var(--primary) / 0.1) 1px, transparent 1px)
                   `,
                   backgroundSize: '48px 48px'
                 }}></div>
            
            {/* Accent dots for visual interest */}
            <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-accent rounded-full opacity-60"></div>
            <div className="absolute bottom-1/3 right-1/4 w-1.5 h-1.5 bg-secondary rounded-full opacity-70"></div>
            <div className="absolute top-2/3 left-1/4 w-1 h-1 bg-primary rounded-full opacity-80"></div>
          </div>
          <div className="relative mx-auto max-w-[1024px] px-4 sm:px-6 lg:px-0 py-12 sm:py-16 flex flex-col items-center gap-8">
            <div className="text-center">
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">Made for <span className="text-actblue">ActBlue</span></span>
              </div>
              <h1 className="mt-2 text-[64px] font-bold tracking-tight leading-[1.1]">Thank Donors<br />Effortlessly</h1>
              <p className="mt-4 text-[20px] text-muted-foreground max-w-prose mx-auto">
                Connect ActBlue once. We'll send postcards thanking<br />every new donor using your logo, personal<br />message, and optional signature.
              </p>
              
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link to="/auth?mode=signup"><Button size="lg">Start for Free</Button></Link>
                <a href="#pricing" className="text-sm underline underline-offset-4">See pricing</a>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>No setup fees</span>
                </div>
                <div className="flex items-center gap-1">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Cancel anytime</span>
                </div>
                <div className="flex items-center gap-1">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Postage included</span>
                </div>
              </div>
            </div>
            <div className="w-full max-w-4xl mx-auto">
              <div className="relative aspect-video bg-muted rounded-xl overflow-hidden shadow-2xl">
                <video 
                  className="w-full h-full object-cover"
                  controls
                  poster="/placeholder-video-thumbnail.jpg"
                  preload="metadata"
                >
                  <source src="/demo-video.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="mx-auto max-w-[1024px] px-4 sm:px-6 lg:px-0 py-14">
          <h2 className="text-2xl font-semibold mb-8">How it works</h2>
          <Accordion type="single" collapsible className="space-y-4" defaultValue="step-1">
            <AccordionItem value="step-1" className="border rounded-lg">
              <AccordionTrigger className="px-6 py-4 hover:no-underline [&>svg]:hidden">
                <div className="flex items-center justify-between text-left w-full">
                  <div>
                    <h3 className="text-lg font-semibold">1) Connect ActBlue</h3>
                    <p className="text-sm text-muted-foreground mt-1">Set up your integration in minutes</p>
                  </div>
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-data-[state=open]:hidden">
                    <Plus className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-data-[state=closed]:hidden">
                    <Minus className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Add your webhook credentials and authorize Thank Donors to receive donor data securely. 
                      Our simple setup process guides you through connecting your ActBlue account safely.
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span>Secure OAuth integration</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span>Real-time data sync</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span>5-minute setup</span>
                      </li>
                    </ul>
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-actblue rounded-lg mx-auto mb-2 flex items-center justify-center">
                          <span className="text-white font-bold text-xs">AB</span>
                        </div>
                        <p className="text-sm font-medium">ActBlue Integration</p>
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step-2" className="border rounded-lg">
              <AccordionTrigger className="px-6 py-4 hover:no-underline [&>svg]:hidden">
                <div className="flex items-center justify-between text-left w-full">
                  <div>
                    <h3 className="text-lg font-semibold">2) Customize your postcard</h3>
                    <p className="text-sm text-muted-foreground mt-1">Design your perfect thank you message</p>
                  </div>
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-data-[state=open]:hidden">
                    <Plus className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-data-[state=closed]:hidden">
                    <Minus className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Use your committee name, return address, logo, and message. Add a signature for a personal touch.
                      Our templates ensure professional design while maintaining USPS compliance.
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span>Upload your logo</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span>Custom message editor</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span>Digital signature support</span>
                      </li>
                    </ul>
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <div className="aspect-video bg-gradient-to-br from-secondary/20 to-primary/20 rounded-lg flex items-center justify-center">
                      <div className="bg-white rounded shadow-lg p-4 max-w-[200px] w-full">
                        <div className="text-center space-y-2">
                          <div className="w-8 h-8 bg-primary rounded mx-auto"></div>
                          <div className="h-2 bg-muted rounded w-3/4 mx-auto"></div>
                          <div className="h-2 bg-muted rounded w-1/2 mx-auto"></div>
                          <div className="text-xs text-muted-foreground">Postcard Preview</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step-3" className="border rounded-lg">
              <AccordionTrigger className="px-6 py-4 hover:no-underline [&>svg]:hidden">
                <div className="flex items-center justify-between text-left w-full">
                  <div>
                    <h3 className="text-lg font-semibold">3) We mail automatically</h3>
                    <p className="text-sm text-muted-foreground mt-1">Sit back and watch the magic happen</p>
                  </div>
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-data-[state=open]:hidden">
                    <Plus className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-data-[state=closed]:hidden">
                    <Minus className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Each new donor gets a postcard—no manual work required. Track delivery speed by plan and 
                      monitor your campaign's thank you outreach in real-time.
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span>Automatic trigger on donation</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span>Real-time delivery tracking</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span>Campaign analytics</span>
                      </li>
                    </ul>
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <div className="aspect-video bg-gradient-to-br from-accent/20 to-secondary/20 rounded-lg flex items-center justify-center">
                      <div className="text-center space-y-3">
                        <div className="flex justify-center space-x-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                        </div>
                        <p className="text-sm font-medium">Auto-mailing in progress</p>
                        <p className="text-xs text-muted-foreground">157 postcards sent today</p>
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* Features */}
        <section id="features" className="bg-secondary/40 border-y">
          <div className="mx-auto max-w-[1024px] px-4 sm:px-6 lg:px-0 py-14">
            <h2 className="text-2xl font-semibold mb-8">Why campaigns choose Thank Donors</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 h-[700px]">
              {/* Large card - spans 2x2 */}
              <Card className="md:col-span-2 lg:col-span-2 md:row-span-2 flex flex-col">
                <CardHeader>
                  <CardTitle className="text-xl">Zero manual work</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex items-center">
                  <p className="text-lg">Connect once and we automatically mail every new ActBlue donor a personalized thank-you postcard.</p>
                </CardContent>
              </Card>
              
              {/* Medium card - spans 2x1 */}
              <Card className="md:col-span-2 lg:col-span-2">
                <CardHeader>
                  <CardTitle>Brand‑ready templates</CardTitle>
                </CardHeader>
                <CardContent>Clean, configurable layout that always fits USPS guidelines with your logo and message.</CardContent>
              </Card>
              
              {/* Tall card - spans 1x2 */}
              <Card className="md:col-span-2 lg:col-span-2 md:row-span-2 flex flex-col">
                <CardHeader>
                  <CardTitle>Fast delivery options</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-center space-y-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <p className="font-medium">Standard Class</p>
                    <p className="text-sm text-muted-foreground">Up to 10 business days</p>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <p className="font-medium">First Class</p>
                    <p className="text-sm text-muted-foreground">~3 business days</p>
                  </div>
                </CardContent>
              </Card>
              
              {/* Medium card - spans 2x1 */}
              <Card className="md:col-span-2 lg:col-span-2">
                <CardHeader>
                  <CardTitle>Affordable at scale</CardTitle>
                </CardHeader>
                <CardContent>Usage‑based pricing fits any campaign size—pay only for mailings, no monthly minimums.</CardContent>
              </Card>
              
              {/* Small card - spans 2x1 */}
              <Card className="md:col-span-2 lg:col-span-2">
                <CardHeader>
                  <CardTitle>Real‑time tracking</CardTitle>
                </CardHeader>
                <CardContent>Monitor delivery status and track campaign performance with detailed analytics and reporting.</CardContent>
              </Card>
              
              {/* Wide card - spans 4x1 */}
              <Card className="md:col-span-4 lg:col-span-4">
                <CardHeader>
                  <CardTitle>Built for political campaigns</CardTitle>
                </CardHeader>
                <CardContent>Designed specifically for ActBlue integration with FEC compliance considerations and campaign-focused features.</CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="mx-auto max-w-[1024px] px-4 sm:px-6 lg:px-0 py-14">
          <h2 className="text-2xl font-semibold">Simple pricing</h2>
          <p className="mt-2 text-muted-foreground">Pick the plan that matches your delivery speed and volume.</p>
          <div className="mt-6 grid md:grid-cols-2 gap-6 items-stretch">
            <Card>
              <CardHeader>
                <CardTitle>Free</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-3xl font-bold">$0<span className="text-base font-normal text-muted-foreground">/mo</span></div>
                <ul className="space-y-2 text-sm">
                  <li>• $1.79 per postcard</li>
                  <li>• Standard class mail (up to 10 business days)</li>
                  <li>• All core features</li>
                </ul>
                <Link to="/dashboard"><Button className="w-full">Choose Free</Button></Link>
              </CardContent>
            </Card>
            <Card className="border-primary">
              <CardHeader>
                <CardTitle>Pro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-3xl font-bold">$79<span className="text-base font-normal text-muted-foreground">/mo</span></div>
                <ul className="space-y-2 text-sm">
                  <li>• $0.79 per postcard</li>
                  <li>• First class mail (~3 business days)</li>
                  <li>• Priority support</li>
                </ul>
                <Link to="/dashboard"><Button className="w-full">Choose Pro</Button></Link>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto max-w-[1024px] px-4 sm:px-6 lg:px-0 py-14">
          <h2 className="text-2xl font-semibold">Frequently asked questions</h2>
          <Accordion type="single" collapsible className="mt-4">
            <AccordionItem value="item-1">
              <AccordionTrigger>Do I need to export data from ActBlue?</AccordionTrigger>
              <AccordionContent>
                No. Once connected, ActBlue sends donor details directly to us automatically.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Can I add my committee logo and return address?</AccordionTrigger>
              <AccordionContent>
                Yes. Tell us your committee name with a mailing address, share your logo, and add a personal message for your donors, all in your dashboard.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>How fast is delivery?</AccordionTrigger>
              <AccordionContent>
                Our Free plan uses Standard Class (up to 10 business days). While, Pro plans use First Class (3 business days or less).
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      </main>

      <footer className="border-t bg-card">
        <div className="mx-auto max-w-[1024px] px-4 sm:px-6 lg:px-0 py-8 flex items-center justify-between text-sm">
          <div>© {new Date().getFullYear()} Thank Donors</div>
          <div className="flex items-center gap-4">
            <a href="#pricing" className="hover:opacity-80">Pricing</a>
            <Link to="/dashboard" className="hover:opacity-80">Open dashboard</Link>
          </div>
        </div>
      </footer>
    </div>;
}
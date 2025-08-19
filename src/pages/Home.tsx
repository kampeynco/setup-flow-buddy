import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import PostcardPreview from "@/components/PostcardPreview";
import TermsOfServiceDialog from "@/components/TermsOfServiceDialog";
import PrivacyPolicyDialog from "@/components/PrivacyPolicyDialog";
import { Check, Plus, Minus, Settings, ArrowRight, Palette, Truck, Zap, TrendingDown, BarChart3, Building2, Shield, Star, X } from "lucide-react";
import logoIcon from "@/assets/logo_icon_white.svg";
import logoIconRegular from "@/assets/logo_icon_regular.svg";
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
  const [activeStep, setActiveStep] = useState("step-1");
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return <div className="min-h-screen flex flex-col">
      <header className={`${scrolled ? "sticky top-0" : "absolute top-0 left-0 right-0"} z-50 transition-colors ${scrolled ? "bg-card/95 backdrop-blur-sm text-foreground" : "bg-transparent text-white"}`}>
        <div className="mx-auto max-w-[1024px] px-4 sm:px-6 lg:px-0 py-3 flex items-center justify-between relative z-10">
          <Link to="/" className="flex items-center gap-2 font-sans text-lg font-semibold" aria-label="Thank Donors Home">
            <img src={scrolled ? logoIconRegular : logoIcon} alt="Thank Donors logo icon" className="h-6 w-6" />
            <span>Thank Donors</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#features" className={scrolled ? "text-foreground/80 hover:text-foreground" : "text-white/80 hover:text-white"}>Features</a>
            <a href="#how" className={scrolled ? "text-foreground/80 hover:text-foreground" : "text-white/80 hover:text-white"}>How it works</a>
            <a href="#pricing" className={scrolled ? "text-foreground/80 hover:text-foreground" : "text-white/80 hover:text-white"}>Pricing</a>
            <a href="#faq" className={scrolled ? "text-foreground/80 hover:text-foreground" : "text-white/80 hover:text-white"}>FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/auth" className="hidden sm:inline-block">
              <Button variant="ghost" className={scrolled ? "" : "text-white hover:bg-white/20"}>Login</Button>
            </Link>
            <Link to="/auth?mode=signup">
              <Button variant={scrolled ? "default" : "secondary"} className="font-semibold">Start for Free</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden" 
                 style={{
                   background: 'linear-gradient(180deg, rgba(3, 101, 199, 1) 30%, rgba(255, 255, 255, 1) 100%)'
                 }}>
          <div className="relative mx-auto max-w-[1024px] px-4 sm:px-6 lg:px-0 pt-20 pb-12 sm:pt-24 sm:pb-16 flex flex-col items-center gap-8">
            <div className="text-center">
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-white/20 border border-white/30">
                <span className="text-xs font-semibold uppercase tracking-wider text-white">Made for <span className="text-white font-bold">ActBlue</span></span>
              </div>
              <h1 className="mt-2 text-4xl sm:text-5xl lg:text-[64px] font-bold tracking-tight leading-[1.1] text-white">Effortlessly<br />Thank Donors</h1>
              <p className="mt-4 text-base sm:text-lg lg:text-[20px] text-white/80 max-w-prose mx-auto">
                Connect ActBlue once. We'll send postcards thanking every new donor using your logo, personal message, and optional signature.
              </p>
              
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link to="/auth?mode=signup"><Button size="lg">Start for Free</Button></Link>
                <a href="#pricing" className="text-sm underline underline-offset-4 text-white/90 hover:text-white">See pricing</a>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm text-white/80">
                <div className="flex items-center gap-1">
                  <Check className="h-4 w-4 text-green-400" />
                  <span>No setup fees</span>
                </div>
                <div className="flex items-center gap-1">
                  <Check className="h-4 w-4 text-green-400" />
                  <span>Cancel anytime</span>
                </div>
                <div className="flex items-center gap-1">
                  <Check className="h-4 w-4 text-green-400" />
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
              
              {/* Social Proof */}
              <div className="mt-16 text-center">
                <div className="flex items-center justify-center gap-8 opacity-60 grayscale">
                  <img src="https://via.placeholder.com/120x48/e5e7eb/6b7280?text=Company" alt="Company logo" className="h-12 object-contain" />
                  <img src="https://via.placeholder.com/120x48/e5e7eb/6b7280?text=Brand" alt="Brand logo" className="h-12 object-contain" />
                  <img src="https://via.placeholder.com/120x48/e5e7eb/6b7280?text=Corp" alt="Corp logo" className="h-12 object-contain" />
                  <img src="https://via.placeholder.com/120x48/e5e7eb/6b7280?text=Group" alt="Group logo" className="h-12 object-contain" />
                  <img src="https://via.placeholder.com/120x48/e5e7eb/6b7280?text=Inc" alt="Inc logo" className="h-12 object-contain" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="bg-gradient-to-b from-primary/5 to-white">
          <div className="relative mx-auto max-w-[1024px] px-4 sm:px-6 lg:px-0 py-14">
          <h2 className="text-3xl sm:text-4xl lg:text-[48px] font-bold tracking-tight leading-[1.1] mb-8 text-center">Send thank you postcards to your donors</h2>
          
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left Column - Accordion */}
            <div>
              <Accordion 
                type="single" 
                collapsible 
                className="space-y-0" 
                defaultValue="step-1"
                value={activeStep}
                onValueChange={(value) => setActiveStep(value || "step-1")}
              >
                <AccordionItem value="step-1" className="border-b border-border">
                  <AccordionTrigger className="py-6 hover:no-underline [&>svg]:hidden [&[data-state=open]_.icon-plus]:rotate-45">
                    <div className="flex items-center justify-between text-left w-full">
                      <div>
                        <h3 className="text-lg font-medium">1. Connect ActBlue</h3>
                        <p className="text-sm text-muted-foreground mt-1">Set up your integration in minutes</p>
                      </div>
                      <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center ml-4">
                        <Plus className="icon-plus h-5 w-5 text-muted-foreground transition-transform duration-200" />
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-6">
                    <div className="space-y-4">
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        Add your webhook credentials and authorize Thank Donors to receive donor data securely. 
                        Our simple setup process guides you through connecting your ActBlue account safely.
                      </p>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <span>Secure integration</span>
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
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="step-2" className="border-b border-border">
                  <AccordionTrigger className="py-6 hover:no-underline [&>svg]:hidden [&[data-state=open]_.icon-plus]:rotate-45">
                    <div className="flex items-center justify-between text-left w-full">
                      <div>
                        <h3 className="text-lg font-medium">2. Customize your postcard</h3>
                        <p className="text-sm text-muted-foreground mt-1">Design your perfect thank you message</p>
                      </div>
                      <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center ml-4">
                        <Plus className="icon-plus h-5 w-5 text-muted-foreground transition-transform duration-200" />
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-6">
                    <div className="space-y-4">
                      <p className="text-muted-foreground text-sm leading-relaxed">
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
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="step-3" className="border-b border-border">
                  <AccordionTrigger className="py-6 hover:no-underline [&>svg]:hidden [&[data-state=open]_.icon-plus]:rotate-45">
                    <div className="flex items-center justify-between text-left w-full">
                      <div>
                        <h3 className="text-lg font-medium">3. We mail automatically</h3>
                        <p className="text-sm text-muted-foreground mt-1">Sit back and watch the magic happen</p>
                      </div>
                      <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center ml-4">
                        <Plus className="icon-plus h-5 w-5 text-muted-foreground transition-transform duration-200" />
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-6">
                    <div className="space-y-4">
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        Each new donor gets a postcard—no manual work required. Track delivery speed by plan and 
                        monitor your committee's thank you outreach in real-time.
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
                          <span>Mail delivery notifications</span>
                        </li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* Right Column - Dynamic Visuals */}
            <div className="lg:sticky lg:top-8">
              <div className="bg-muted/50 rounded-lg p-6 min-h-[400px] flex items-center justify-center">
                {activeStep === "step-1" && (
                  <div className="aspect-video bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg flex items-center justify-center w-full">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-actblue rounded-lg mx-auto mb-3 flex items-center justify-center">
                        <span className="text-white font-bold text-xs">AB</span>
                      </div>
                      <p className="text-sm font-medium">ActBlue Integration</p>
                      <p className="text-xs text-muted-foreground mt-1">Connected</p>
                    </div>
                  </div>
                )}

                {activeStep === "step-2" && (
                  <div className="aspect-video bg-gradient-to-br from-secondary/10 to-primary/10 rounded-lg flex items-center justify-center w-full">
                    <div className="bg-white rounded shadow-lg p-4 max-w-[200px] w-full">
                      <div className="text-center space-y-2">
                        <div className="w-8 h-8 bg-primary rounded mx-auto"></div>
                        <div className="h-2 bg-muted rounded w-3/4 mx-auto"></div>
                        <div className="h-2 bg-muted rounded w-1/2 mx-auto"></div>
                        <div className="text-xs text-muted-foreground">Postcard Preview</div>
                      </div>
                    </div>
                  </div>
                )}

                {activeStep === "step-3" && (
                  <div className="aspect-video bg-gradient-to-br from-accent/10 to-secondary/10 rounded-lg flex items-center justify-center w-full">
                    <div className="text-center space-y-3">
                      <div className="flex justify-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                      </div>
                      <p className="text-sm font-medium">Thanking Donors</p>
                      <p className="text-xs text-muted-foreground">157 postcards mailed today</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        </section>

        {/* Features */}
        <section id="features" className="bg-secondary/40 border-y">
          <div className="mx-auto max-w-[1024px] px-4 sm:px-6 lg:px-0 py-16 sm:py-18 lg:py-24">
            <h2 className="text-3xl sm:text-4xl lg:text-[48px] font-bold tracking-tight leading-[1.1] mb-8 text-center">Why committees choose Thank Donors</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 lg:h-[700px]">
              {/* Large card - spans 2x2 */}
              <Card className="md:col-span-2 lg:col-span-2 md:row-span-2 flex flex-col">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-1">
                      <Settings className="h-5 w-5 text-primary" />
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                  <CardTitle className="text-xl">Zero manual work</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex items-start">
                  <p className="text-lg">Connect once and we automatically mail every new ActBlue donor a personalized thank-you postcard.</p>
                </CardContent>
              </Card>
              
              {/* Medium card - spans 2x1 */}
              <Card className="md:col-span-2 lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-6 bg-gradient-to-r from-primary to-secondary rounded border shadow-sm flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <Palette className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle>Brand‑ready templates</CardTitle>
                </CardHeader>
                <CardContent>Clean, configurable layout that always fits USPS guidelines with your logo and message.</CardContent>
              </Card>
              
              {/* Tall card - spans 1x2 */}
              <Card className="md:col-span-2 lg:col-span-2 md:row-span-2 flex flex-col">
                <CardHeader>
                  <CardTitle>Fast delivery options</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-start space-y-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium">Standard Class</p>
                      <Truck className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">7 to 10 business days</p>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium">First Class</p>
                      <Zap className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">3 to 5 business days</p>
                  </div>
                </CardContent>
              </Card>
              
              {/* Medium card - spans 2x1 */}
              <Card className="md:col-span-2 lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="h-5 w-5 text-green-600" />
                    <div className="flex items-end gap-1">
                      <div className="w-2 h-3 bg-primary/40 rounded-sm"></div>
                      <div className="w-2 h-4 bg-primary/60 rounded-sm"></div>
                      <div className="w-2 h-2 bg-primary/80 rounded-sm"></div>
                      <div className="w-2 h-1 bg-primary rounded-sm"></div>
                    </div>
                  </div>
                  <CardTitle>Affordable at scale</CardTitle>
                </CardHeader>
                <CardContent>Usage‑based pricing fits any campaign size—pay only for mailings, no monthly minimums.</CardContent>
              </Card>
              
              {/* Small card - spans 2x1 */}
              <Card className="md:col-span-2 lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                  <CardTitle>Real‑time tracking</CardTitle>
                </CardHeader>
                <CardContent>Monitor delivery status and track campaign performance with detailed analytics and reporting.</CardContent>
              </Card>
              
              {/* Wide card - spans 4x1 */}
              <Card className="md:col-span-4 lg:col-span-4">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <div className="w-6 h-4 bg-gradient-to-r from-blue-500 to-red-500 rounded-sm flex items-center justify-center">
                      <Star className="h-2 w-2 text-white fill-white" />
                    </div>
                  </div>
                  <CardTitle>Built for political organizations</CardTitle>
                </CardHeader>
                <CardContent>Designed specifically for ActBlue integration with FEC compliance considerations and campaign-focused features.</CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="mx-auto max-w-[1024px] px-4 sm:px-6 lg:px-0 py-16 sm:py-18 lg:py-24">
          <h2 className="text-3xl sm:text-4xl lg:text-[48px] font-bold tracking-tight leading-[1.1] mb-4 text-center">Simple pricing</h2>
          <p className="text-base sm:text-lg lg:text-[20px] text-muted-foreground max-w-prose mx-auto text-center mb-8">Pick the plan that matches your delivery speed and volume.</p>
          <div className="mt-6 grid md:grid-cols-2 gap-6 items-stretch max-w-4xl mx-auto">
            <Card className="relative">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl font-semibold">Free</CardTitle>
                <div className="text-4xl font-bold mt-2">
                  $0<span className="text-lg font-normal text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Perfect for getting started</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-600 shrink-0" strokeWidth={2.5} />
                    <span className="text-sm">$1.79 per postcard</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-600 shrink-0" strokeWidth={2.5} />
                    <span className="text-sm">Standard class mail (7 to 10 business days)</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-600 shrink-0" strokeWidth={2.5} />
                    <span className="text-sm">Basic branding options</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-600 shrink-0" strokeWidth={2.5} />
                    <span className="text-sm">Email support</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <X className="h-4 w-4 text-red-600 shrink-0" strokeWidth={2.5} />
                    <span className="text-sm">Remove Thank Donors branding</span>
                  </li>
                </ul>
                <div className="space-y-2">
                  <Link to="/dashboard" className="block">
                    <Button variant="outline" className="w-full">Create Free Account</Button>
                  </Link>
                  <p className="text-xs text-muted-foreground text-center">No setup fees, cancel anytime</p>
                </div>
              </CardContent>
            </Card>

            <Card className="relative border-primary bg-primary/5">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                  Most Popular
                </span>
              </div>
              <CardHeader className="text-center pb-4 pt-6">
                <CardTitle className="text-xl font-semibold">Pro</CardTitle>
                <div className="text-4xl font-bold mt-2">
                  $79<span className="text-lg font-normal text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Best for active committees</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-600 shrink-0" strokeWidth={2.5} />
                    <span className="text-sm font-medium">$0.79 per postcard (55% savings)</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-600 shrink-0" strokeWidth={2.5} />
                    <span className="text-sm">First class mail (3 to 5 business days)</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-600 shrink-0" strokeWidth={2.5} />
                    <span className="text-sm">Custom branding options</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-600 shrink-0" strokeWidth={2.5} />
                    <span className="text-sm">Email and Phone support</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-600 shrink-0" strokeWidth={2.5} />
                    <span className="text-sm">Remove Thank Donors branding</span>
                  </li>
                </ul>
                <div className="space-y-2">
                  <Link to="/dashboard" className="block">
                    <Button className="w-full">Create Free Account</Button>
                  </Link>
                  <p className="text-xs text-muted-foreground text-center">No setup fees, cancel anytime</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto max-w-[1024px] px-4 sm:px-6 lg:px-0 py-14">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl lg:text-[48px] font-bold tracking-tight leading-[1.1] mb-4 text-center">Frequently asked questions</h2>
            <p className="text-base sm:text-lg lg:text-[20px] text-muted-foreground max-w-prose mx-auto text-center mb-8">Get answers to common questions about our service</p>
          </div>
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="item-1" className="border border-border rounded-lg px-6 py-2">
                <AccordionTrigger className="text-left hover:no-underline py-4">
                  Do I need to export data from ActBlue?
                </AccordionTrigger>
                <AccordionContent className="pb-4 text-muted-foreground">
                  No. Once connected, ActBlue sends donor details directly to us automatically.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2" className="border border-border rounded-lg px-6 py-2">
                <AccordionTrigger className="text-left hover:no-underline py-4">
                  Can I add my committee logo and return address?
                </AccordionTrigger>
                <AccordionContent className="pb-4 text-muted-foreground">
                  Yes. Tell us your committee name with a mailing address, share your logo, and add a personal message for your donors, all in your dashboard.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3" className="border border-border rounded-lg px-6 py-2">
                <AccordionTrigger className="text-left hover:no-underline py-4">
                  How fast is delivery?
                </AccordionTrigger>
                <AccordionContent className="pb-4 text-muted-foreground">
                  Our Free plan uses Standard Class (up to 10 business days). While, Pro plans use First Class (3 business days or less).
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>
      </main>

      <footer className="bg-foreground text-background border-t">
        <div className="mx-auto max-w-[1024px] px-4 sm:px-6 lg:px-0 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Logo and Description */}
            <div className="md:col-span-1">
              <Link to="/" className="flex items-center gap-2 font-sans text-lg font-semibold mb-4" aria-label="Thank Donors Home">
                <img src={logoIcon} alt="Thank Donors logo icon" className="h-6 w-6" />
                <span>Thank Donors</span>
              </Link>
              <p className="text-sm text-background/70 mb-6 leading-relaxed">
                Postcard donations made easy. Let your donors generate and send personalized thank you postcards. No more manual work. No more headaches.
              </p>
              <div className="text-xs text-background/60">
                Copyright © {new Date().getFullYear()} - All rights reserved
              </div>
            </div>

            {/* Links Column */}
            <div>
              <h3 className="font-semibold text-sm mb-4 text-background/60 uppercase tracking-wider">LINKS</h3>
              <ul className="space-y-3 text-sm">
                <li><a href="#features" className="text-background hover:text-background/80 transition-colors">Support</a></li>
                <li><a href="#pricing" className="text-background hover:text-background/80 transition-colors">Pricing</a></li>
              </ul>
            </div>

            {/* Legal Column */}
            <div>
              <h3 className="font-semibold text-sm mb-4 text-background/60 uppercase tracking-wider">LEGAL</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <TermsOfServiceDialog>
                    <button className="text-background hover:text-background/80 transition-colors">Terms of service</button>
                  </TermsOfServiceDialog>
                </li>
                <li>
                  <PrivacyPolicyDialog>
                    <button className="text-background hover:text-background/80 transition-colors">Privacy policy</button>
                  </PrivacyPolicyDialog>
                </li>
              </ul>
            </div>

            {/* More Column */}
            <div>
              <h3 className="font-semibold text-sm mb-4 text-background/60 uppercase tracking-wider">MORE</h3>
              <ul className="space-y-3 text-sm">
                <li><a href="#how" className="text-background hover:text-background/80 transition-colors">How it works</a></li>
                <li><a href="#faq" className="text-background hover:text-background/80 transition-colors">FAQ</a></li>
                <li><Link to="/auth?mode=signup" className="text-background hover:text-background/80 transition-colors">Get Started</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="mt-12 pt-8 border-t border-border/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-background/60">
              <span>Built with</span>
              <span className="inline-flex items-center gap-1 bg-background text-foreground px-2 py-1 rounded font-medium">
                ⚡ Lovable
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-background/60">
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                👋
              </div>
              <span>Hey there! Made with care for political organizations and nonprofits.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>;
}
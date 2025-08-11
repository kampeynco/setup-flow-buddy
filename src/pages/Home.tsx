import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import PostcardPreview from "@/components/PostcardPreview";
import { Check } from "lucide-react";

function useSEO({ title, description, jsonLd }: { title: string; description: string; jsonLd?: object }) {
  useEffect(() => {
    document.title = title;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", description);
    else {
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
    description:
      "Connect ActBlue to Thank Donors and automatically mail branded, signed thank‑you postcards to supporters.",
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          name: 'Thank Donors',
          applicationCategory: 'MarketingAutomation',
          offers: [
            {
              '@type': 'Offer',
              name: 'Free',
              price: '0',
              priceCurrency: 'USD',
              description: 'Usage $1.79 per postcard. Standard class mail (up to 10 business days).',
            },
            {
              '@type': 'Offer',
              name: 'Pro',
              price: '79',
              priceCurrency: 'USD',
              description: 'Usage $0.79 per postcard. First class mail (about 3 business days).',
            },
          ],
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'Do I need to export data from ActBlue?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'No. Once connected, ActBlue sends donor details to Thank Donors automatically.'
              }
            },
            {
              '@type': 'Question',
              name: 'Can I add my committee logo and return address?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes—set your committee name, logo, return address, and postcard message in your dashboard.'
              }
            },
            {
              '@type': 'Question',
              name: 'How fast is delivery?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Free uses Standard Class (up to 10 business days). Pro uses First Class (about 3 business days).'
              }
            }
          ]
        }
      ]
    },
  });

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <header className={`sticky top-0 z-50 border-b transition-colors ${scrolled ? "bg-card" : "bg-hero"}`}>
        <div className="mx-auto max-w-[1024px] px-4 sm:px-6 lg:px-0 py-3 flex items-center justify-between">
          <Link to="/" className="font-semibold">Thank Donors</Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#features" className="hover:opacity-80">Features</a>
            <a href="#how" className="hover:opacity-80">How it works</a>
            <a href="#pricing" className="hover:opacity-80">Pricing</a>
            <a href="#faq" className="hover:opacity-80">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/app" className="hidden sm:inline-block">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link to="/app">
              <Button>Try for Free</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="border-b bg-hero">
          <div className="mx-auto max-w-[1024px] px-4 sm:px-6 lg:px-0 py-12 sm:py-16 grid lg:grid-cols-2 items-center gap-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Automate thank‑you postcards for your ActBlue donors</h1>
              <p className="mt-4 text-muted-foreground max-w-prose">
                Connect ActBlue once. We’ll mail branded postcards to every new donor—using your committee details, message, and optional signature.
              </p>
              <ul className="mt-6 space-y-2">
                {[
                  'Direct ActBlue integration',
                  'Branded postcard template with your message',
                  'Automatic mailing—no spreadsheets',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link to="/app"><Button size="lg">Try for Free Today</Button></Link>
                <a href="#pricing" className="text-sm underline underline-offset-4">See pricing</a>
              </div>
            </div>
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Postcard preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="scale-95 origin-top w-full overflow-x-auto">
                  <PostcardPreview />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="mx-auto max-w-[1024px] px-4 sm:px-6 lg:px-0 py-14">
          <h2 className="text-2xl font-semibold">How it works</h2>
          <div className="mt-6 grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>1) Connect ActBlue</CardTitle>
              </CardHeader>
              <CardContent>
                Add your webhook credentials and authorize Thank Donors to receive donor data securely.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>2) Customize your postcard</CardTitle>
              </CardHeader>
              <CardContent>
                Use your committee name, return address, logo, and message. Add a signature for a personal touch.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>3) We mail automatically</CardTitle>
              </CardHeader>
              <CardContent>
                Each new donor gets a postcard—no manual work. Track delivery speed by plan.
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="bg-secondary/40 border-y">
          <div className="mx-auto max-w-[1024px] px-4 sm:px-6 lg:px-0 py-14 grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Brand‑ready templates</CardTitle>
              </CardHeader>
              <CardContent>Clean, configurable layout that always fits USPS guidelines.</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Fast delivery</CardTitle>
              </CardHeader>
              <CardContent>Choose Standard (up to 10 business days) or First Class (~3 business days).</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Affordable at scale</CardTitle>
              </CardHeader>
              <CardContent>Usage‑based pricing fits any campaign size—pay only for mailings.</CardContent>
            </Card>
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
                <Link to="/app"><Button className="w-full">Choose Free</Button></Link>
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
                <Link to="/app"><Button className="w-full">Choose Pro</Button></Link>
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
                No. Once connected, ActBlue sends donor details to Thank Donors automatically.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Can I add my committee logo and return address?</AccordionTrigger>
              <AccordionContent>
                Yes—set your committee name, logo, return address, and postcard message in your dashboard.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>How fast is delivery?</AccordionTrigger>
              <AccordionContent>
                Free uses Standard Class (up to 10 business days). Pro uses First Class (~3 business days).
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
            <Link to="/app" className="hover:opacity-80">Open dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

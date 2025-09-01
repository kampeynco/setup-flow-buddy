import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import { PaymentSuccess } from "./pages/PaymentSuccess";
import OnboardingWebhookInterstitial from "./pages/OnboardingWebhookInterstitial";
import OnboardingSenderDetails from "./pages/OnboardingSenderDetails";
import OnboardingPostcardPreview from "./pages/OnboardingPostcardPreview";
import OnboardingBilling from "./pages/OnboardingBilling";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/onboarding/webhook" element={<OnboardingWebhookInterstitial />} />
          <Route path="/onboarding/step-1" element={<OnboardingSenderDetails />} />
          <Route path="/onboarding/step-2" element={<OnboardingPostcardPreview />} />
          <Route path="/onboarding/step-3" element={<OnboardingBilling />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TermsOfServiceDialogProps {
  children: React.ReactNode;
}

export default function TermsOfServiceDialog({ children }: TermsOfServiceDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Terms of Service</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6 text-sm">
            <div>
              <h3 className="font-semibold mb-2">1. Acceptance of Terms</h3>
              <p className="text-muted-foreground">
                By accessing and using Thank Donors, you accept and agree to be bound by the terms and provision of this agreement.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">2. Description of Service</h3>
              <p className="text-muted-foreground">
                Thank Donors is a platform that enables political campaigns and nonprofits to allow their donors to generate and send personalized thank you postcards. Our service automates the postcard creation and mailing process.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">3. User Accounts</h3>
              <p className="text-muted-foreground">
                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">4. Acceptable Use</h3>
              <p className="text-muted-foreground">
                You agree to use the service only for lawful purposes and in accordance with these Terms. You will not use the service to send inappropriate, offensive, or illegal content through the postcard service.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">5. Payment and Billing</h3>
              <p className="text-muted-foreground">
                Certain features of our service require payment. You agree to pay all charges incurred by your account. We reserve the right to change our pricing structure at any time with reasonable notice.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">6. Data and Privacy</h3>
              <p className="text-muted-foreground">
                We collect and process personal data in accordance with our Privacy Policy. By using our service, you consent to such processing and you warrant that all data provided by you is accurate.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">7. Intellectual Property</h3>
              <p className="text-muted-foreground">
                The service and its original content, features, and functionality are and will remain the exclusive property of Thank Donors and its licensors.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">8. Termination</h3>
              <p className="text-muted-foreground">
                We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">9. Limitation of Liability</h3>
              <p className="text-muted-foreground">
                In no event shall Thank Donors, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">10. Changes to Terms</h3>
              <p className="text-muted-foreground">
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.
              </p>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
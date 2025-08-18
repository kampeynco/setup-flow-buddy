import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PrivacyPolicyDialogProps {
  children: React.ReactNode;
}

export default function PrivacyPolicyDialog({ children }: PrivacyPolicyDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Privacy Policy</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6 text-sm">
            <div>
              <h3 className="font-semibold mb-2">1. Information We Collect</h3>
              <p className="text-muted-foreground mb-2">
                We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support.
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Account information (name, email address, organization details)</li>
                <li>Donor information provided for postcard services</li>
                <li>Payment information (processed securely through third-party providers)</li>
                <li>Communications with our support team</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">2. How We Use Your Information</h3>
              <p className="text-muted-foreground mb-2">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Provide, maintain, and improve our services</li>
                <li>Process postcard orders and facilitate delivery</li>
                <li>Send you technical notices and support messages</li>
                <li>Respond to your comments and questions</li>
                <li>Protect against fraud and abuse</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">3. Information Sharing</h3>
              <p className="text-muted-foreground">
                We do not sell, trade, or otherwise transfer your personal information to third parties except as described in this policy. We may share information with trusted partners who assist us in operating our service, conducting business, or serving users.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">4. Data Security</h3>
              <p className="text-muted-foreground">
                We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">5. Data Retention</h3>
              <p className="text-muted-foreground">
                We retain your information for as long as your account is active or as needed to provide you services. We may retain and use your information as necessary to comply with legal obligations and resolve disputes.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">6. Cookies and Tracking</h3>
              <p className="text-muted-foreground">
                We use cookies and similar tracking technologies to collect and use personal information about you. You can control the use of cookies at the individual browser level.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">7. Third-Party Services</h3>
              <p className="text-muted-foreground">
                Our service may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties and encourage you to read their privacy policies.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">8. Children's Privacy</h3>
              <p className="text-muted-foreground">
                Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">9. Your Rights</h3>
              <p className="text-muted-foreground">
                You have the right to access, update, or delete your personal information. You may also opt out of certain communications from us. Contact us to exercise these rights.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">10. Changes to This Policy</h3>
              <p className="text-muted-foreground">
                We may update this privacy policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the effective date.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">11. Contact Us</h3>
              <p className="text-muted-foreground">
                If you have any questions about this Privacy Policy, please contact us through our support channels.
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
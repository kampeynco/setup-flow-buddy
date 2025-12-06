import { useMemo } from "react";

interface SenderDetails {
  committee_name?: string;
  organization_name?: string;
  street_address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  email?: string;
  phone?: string;
}

interface BackPreviewProps {
  messageTemplate: string;
  senderDetails?: SenderDetails;
  className?: string;
}

// Sample data for preview
const SAMPLE_RECIPIENT = {
  full_name: "Jane Smith",
  first_name: "Jane",
  last_name: "Smith",
  address: "456 Donor Avenue",
  address2: "Apt 2B",
  city: "Springfield",
  state: "IL",
  zip: "62701",
};

const SAMPLE_DATE = new Date().toLocaleDateString('en-US', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
});

export function parseMessageTemplate(
  template: string, 
  senderDetails?: SenderDetails
): string {
  let result = template;
  
  // Replace recipient variables with sample data
  result = result.replace(/%FULL_NAME%/g, SAMPLE_RECIPIENT.full_name);
  result = result.replace(/%FIRST_NAME%/g, SAMPLE_RECIPIENT.first_name);
  result = result.replace(/%LAST_NAME%/g, SAMPLE_RECIPIENT.last_name);
  result = result.replace(/%ADDRESS%/g, SAMPLE_RECIPIENT.address);
  result = result.replace(/%ADDRESS2%/g, SAMPLE_RECIPIENT.address2);
  result = result.replace(/%CITY%/g, SAMPLE_RECIPIENT.city);
  result = result.replace(/%STATE%/g, SAMPLE_RECIPIENT.state);
  result = result.replace(/%ZIP%/g, SAMPLE_RECIPIENT.zip);
  result = result.replace(/%CURRENT_DAY%/g, SAMPLE_DATE);
  
  // Replace sender variables
  const senderName = senderDetails?.committee_name || senderDetails?.organization_name || "Campaign Committee";
  const senderFirstName = senderName.split(' ')[0] || "Campaign";
  
  result = result.replace(/%SENDER_FULL_NAME%/g, senderName);
  result = result.replace(/%SENDER_FIRST_NAME%/g, senderFirstName);
  result = result.replace(/%SENDER_EMAIL%/g, senderDetails?.email || "contact@campaign.org");
  result = result.replace(/%SENDER_PHONE%/g, senderDetails?.phone || "(555) 123-4567");
  
  return result;
}

const INCH_PX = 40; // base scale

export function BackPreview({ messageTemplate, senderDetails, className }: BackPreviewProps) {
  const parsedMessage = useMemo(() => 
    parseMessageTemplate(messageTemplate, senderDetails), 
    [messageTemplate, senderDetails]
  );

  const bleedW = 9.25 * INCH_PX;
  const bleedH = 6.25 * INCH_PX;
  const trimInset = 0.125 * INCH_PX;
  const safeInsetFromTrim = 0.0625 * INCH_PX;
  const safeInset = trimInset + safeInsetFromTrim;

  // Mailing area calculations
  const mailingW = 4 * INCH_PX;
  const mailingH = 2.375 * INCH_PX;
  const trimW = 9 * INCH_PX;
  const trimH = 6 * INCH_PX;
  const mailingRightPadding = 0.375 * INCH_PX;
  const mailingBottomPadding = 0.5 * INCH_PX;
  const mailingLeft = trimInset + (trimW - mailingW - mailingRightPadding);
  const mailingTop = trimInset + (trimH - mailingH - mailingBottomPadding);

  return (
    <div className={className}>
      <div
        className="relative origin-top-left bg-card rounded-lg shadow-sm"
        style={{ 
          width: bleedW, 
          height: bleedH, 
          transform: "scale(1.5)",
          transformOrigin: "top left"
        }}
        aria-label="Back postcard preview"
      >
        {/* Corner label */}
        <div className="absolute left-2 top-2 text-xs font-medium text-muted-foreground">Back</div>

        {/* Trim size */}
        <div
          className="absolute rounded-sm border border-foreground/10"
          style={{ inset: trimInset }}
        />

        {/* Safe zone */}
        <div
          className="absolute rounded-sm border border-background/80 bg-card"
          style={{ inset: safeInset }}
        />

        {/* Message area (left side, avoiding mailing area) */}
        <div
          className="absolute p-3 text-foreground overflow-hidden"
          style={{ 
            left: safeInset, 
            top: safeInset, 
            right: mailingLeft - 10,
            bottom: safeInset + 40
          }}
        >
          <div className="text-[7px] leading-relaxed whitespace-pre-line">
            {parsedMessage}
          </div>
        </div>

        {/* Mailing area (bottom-right) */}
        <div
          className="absolute rounded-sm bg-transparent p-2 text-foreground/80"
          style={{ left: mailingLeft, top: mailingTop, width: mailingW, height: mailingH }}
        >
          {/* Sender details (top-left) */}
          <div className="absolute top-2 left-2 text-[7px] leading-none text-muted-foreground text-left py-1 pr-2">
            <div>{senderDetails?.committee_name || senderDetails?.organization_name || "Campaign Committee"}</div>
            <div>{senderDetails?.street_address || "123 Main Street"}</div>
            <div>
              {senderDetails 
                ? `${senderDetails.city || "City"}, ${senderDetails.state || "ST"} ${senderDetails.postal_code || "12345"}` 
                : "City, ST 12345"
              }
            </div>
          </div>
          
          {/* Mailing barcode */}
          <div className="absolute left-2 right-2 top-10">
            <img
              src="/lovable-uploads/7d41e453-11de-4cbc-8330-837205bd314a.png"
              alt="Mailing barcode"
              className="w-full h-auto object-contain opacity-90 scale-y-75"
            />
          </div>
          
          {/* Recipient details (sample) */}
          <div className="absolute left-2 bottom-3 text-left text-[9px] leading-none whitespace-nowrap">
            <div>{SAMPLE_RECIPIENT.full_name}</div>
            <div>{SAMPLE_RECIPIENT.address}</div>
            <div>{SAMPLE_RECIPIENT.city}, {SAMPLE_RECIPIENT.state} {SAMPLE_RECIPIENT.zip}</div>
          </div>
          
          {/* Postage indicia */}
          <div
            className="absolute top-2 right-2 border-black bg-transparent px-2 py-1 text-[7px] leading-none text-foreground/80 flex items-center justify-center text-center"
            style={{ width: 0.9375 * INCH_PX, height: 0.75 * INCH_PX, borderWidth: '0.5px' }}
          >
            Postage Indicia
          </div>
        </div>
      </div>
    </div>
  );
}

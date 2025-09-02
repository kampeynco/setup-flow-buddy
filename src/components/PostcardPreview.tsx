import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";






const INCH_PX = 40; // base scale: 40px per inch (scales via zoom)



function FrontCanvas() {
  const bleedW = 9.25 * INCH_PX;
  const bleedH = 6.25 * INCH_PX;
  const trimInset = 0.125 * INCH_PX; // (9.25-9)/2 and (6.25-6)/2
  const safeInsetFromTrim = 0.0625 * INCH_PX; // (9-8.875)/2 and (6-5.875)/2
  const safeInset = trimInset + safeInsetFromTrim;

  return (
    <div
      className="relative"
      style={{ width: bleedW, height: bleedH }}
      aria-label="Front postcard technical preview"
    >
      {/* Corner label */}
      <div className="absolute left-2 top-2 text-xs font-medium text-muted-foreground">Front</div>

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

    </div>
  );
}

function BackCanvas() {
  const bleedW = 9.25 * INCH_PX;
  const bleedH = 6.25 * INCH_PX;
  const trimInset = 0.125 * INCH_PX;
  const safeInsetFromTrim = 0.0625 * INCH_PX;
  const safeInset = trimInset + safeInsetFromTrim;

  // Mailing area: 4" x 2.375" positioned bottom-right within trim area
  const mailingW = 4 * INCH_PX;
  const mailingH = 2.375 * INCH_PX;
  const trimW = 9 * INCH_PX;
  const trimH = 6 * INCH_PX;

  const trimLeft = trimInset;
  const trimTop = trimInset;

  const mailingRightPadding = 0.375 * INCH_PX; // little padding from right edge within trim
  const mailingBottomPadding = 0.5 * INCH_PX; // padding from bottom within trim

  const mailingLeft = trimLeft + (trimW - mailingW - mailingRightPadding);
  const mailingTop = trimTop + (trimH - mailingH - mailingBottomPadding);

  // Offsets (dotted lines) around mailing area: 0.125" and 0.15"
  const offsetA = 0.125 * INCH_PX; // show on left side
  const offsetB = 0.15 * INCH_PX; // show on top side

  return (
    <div
      className="relative"
      style={{ width: bleedW, height: bleedH }}
      aria-label="Back postcard technical preview"
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

      {/* Mailing area (bottom-right) */}
      <div
        className="absolute rounded-sm bg-transparent p-2 text-foreground/80 relative"
        style={{ left: mailingLeft, top: mailingTop, width: mailingW, height: mailingH }}
>
        {/* Committee details (top-left, smaller) */}
        <div className="absolute top-2 left-2 text-[7px] leading-none text-muted-foreground text-left py-1 pr-2">
          <div>Placeholder Committee</div>
          <div>123 Main Street</div>
          <div>City, ST 12345</div>
        </div>
        {/* Mailing barcode (above donor details, left-aligned, no overlap) */}
        <div className="absolute left-2 right-2 top-10">
          <img
            src="/lovable-uploads/7d41e453-11de-4cbc-8330-837205bd314a.png"
            alt="Mailing barcode example"
            className="w-full h-auto object-contain opacity-90 scale-y-75"
          />
        </div>
        {/* Donor details (bottom-left, left-aligned, no wrap) */}
        <div className="absolute left-2 bottom-3 text-left text-[9px] leading-none whitespace-nowrap">
          <div>
            <div>Donor Full Name</div>
            <div>456 Donor Avenue</div>
            <div>City, ST 67890</div>
          </div>
        </div>
        {/* Postage indicia (top-right inside mailing area) */}
        <div
          className="absolute top-2 right-2 border border-foreground rounded-sm bg-transparent px-2 py-1 text-[7px] leading-none text-foreground/80 flex items-center justify-center text-center"
          style={{ width: 0.9375 * INCH_PX, height: 0.75 * INCH_PX }}
        >
          Postage Indicia
        </div>
      </div>


      
    </div>
  );
}

export default function PostcardPreview() {
  const [tab, setTab] = useState<"front" | "back">("front");
  const zoom = 1.8; // 1.8x = 180%

  const scale = useMemo(() => `scale(${zoom})`, [zoom]);

  return (
    <div className="relative flex flex-col h-full">

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pr-10">
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList>
            <TabsTrigger value="front">Front</TabsTrigger>
            <TabsTrigger value="back">Back</TabsTrigger>
          </TabsList>
        </Tabs>

      </div>

      {/* Preview area */}
      <div className="mt-4 rounded-md border bg-muted p-4 flex-1 min-h-0">
        <div className="flex h-full w-full items-start justify-center overflow-hidden">
          {tab === "front" && (
            <div style={{ transform: scale }} className="origin-top">
              <FrontCanvas />
            </div>
          )}
          {tab === "back" && (
            <div style={{ transform: scale }} className="origin-top">
              <BackCanvas />
            </div>
          )}
        </div>
        
      </div>

    </div>
  );
}

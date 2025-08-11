import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";


import { toast } from "sonner";

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
        className="absolute rounded-sm border-2 border-foreground"
        style={{ inset: trimInset }}
      />

      {/* Safe zone */}
      <div
        className="absolute rounded-sm bg-primary/20"
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
        className="absolute rounded-sm border-2 border-foreground"
        style={{ inset: trimInset }}
      />

      {/* Safe zone */}
      <div
        className="absolute rounded-sm bg-primary/20"
        style={{ inset: safeInset }}
      />

      {/* Mailing area (bottom-right) */}
      <div
        className="absolute rounded-sm bg-accent/40 p-2 text-[10px] leading-tight text-foreground/80 flex items-center justify-center text-left"
        style={{ left: mailingLeft, top: mailingTop, width: mailingW, height: mailingH }}
      >
        <div>
          <div>Placeholder Committee</div>
          <div>123 Main Street</div>
          <div>City, ST 12345</div>
        </div>
      </div>

      {/* Offset dotted lines with labels */}
      {/* Left offset (0.125") */}
      <div
        className="absolute border-l-2 border-dashed border-muted-foreground"
        style={{
          left: mailingLeft - offsetA,
          top: mailingTop - 6,
          height: mailingH + 12,
        }}
      />
      <span
        className="absolute text-[10px] px-1 py-0.5 rounded bg-background border text-muted-foreground"
        style={{ left: mailingLeft - offsetA - 18, top: mailingTop + mailingH / 2 - 8 }}
      >
        0.125"
      </span>

      {/* Top offset (0.15") */}
      <div
        className="absolute border-t-2 border-dashed border-muted-foreground"
        style={{
          left: mailingLeft - 6,
          top: mailingTop - offsetB,
          width: mailingW + 12,
        }}
      />
      <span
        className="absolute text-[10px] px-1 py-0.5 rounded bg-background border text-muted-foreground"
        style={{ left: mailingLeft + mailingW / 2 - 16, top: mailingTop - offsetB - 18 }}
      >
        0.15"
      </span>

      
    </div>
  );
}

export default function PostcardPreview() {
  const [tab, setTab] = useState<"front" | "back">("front");
  const [zoom, setZoom] = useState(1); // 1x = 100%

  const scale = useMemo(() => `scale(${zoom})`, [zoom]);

  return (
    <div className="relative">

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pr-10">
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList>
            <TabsTrigger value="front">Front</TabsTrigger>
            <TabsTrigger value="back">Back</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground w-14">Zoom</span>
          <div className="w-40">
            <Slider
              value={[zoom * 100]}
              min={50}
              max={200}
              step={5}
              onValueChange={(v) => setZoom((v?.[0] ?? 100) / 100)}
            />
          </div>
          <span className="text-sm tabular-nums w-12 text-right">{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      {/* Preview area */}
      <div className="mt-4 rounded-md border bg-muted p-4">
        <div className="flex items-center justify-center overflow-auto">
          <div
            className={cn("origin-top animate-fade-in", tab === "front" ? "" : "hidden")}
            style={{ transform: scale }}
          >
            <FrontCanvas />
          </div>
          <div
            className={cn("origin-top animate-fade-in", tab === "back" ? "" : "hidden")}
            style={{ transform: scale }}
          >
            <BackCanvas />
          </div>
        </div>
        
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">6×9 in postcard technical template</div>
        <Button onClick={() => toast("Generating PDF template… (demo)")}>Generate PDF Template</Button>
      </div>
    </div>
  );
}

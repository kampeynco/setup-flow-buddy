import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";


import { toast } from "sonner";

const INCH_PX = 40; // base scale: 40px per inch (scales via zoom)

function DimensionLabels() {
  return (
    <div className="absolute inset-0 pointer-events-none select-none">
      {/* Width labels (top center) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-7 flex items-center gap-2 text-xs">
        <span className="px-1.5 py-0.5 rounded bg-background border text-foreground shadow-sm">Bleed: 9.25"</span>
        <span className="px-1.5 py-0.5 rounded bg-background border text-foreground shadow-sm">Trim: 9"</span>
        <span className="px-1.5 py-0.5 rounded bg-background border text-foreground shadow-sm">Safe: 8.875"</span>
      </div>
      {/* Height labels (left center, vertical) */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-7 flex flex-col items-center gap-2 text-xs">
        <span className="px-1.5 py-0.5 rounded bg-background border text-foreground shadow-sm rotate-[-90deg] origin-center">Bleed: 6.25"</span>
        <span className="px-1.5 py-0.5 rounded bg-background border text-foreground shadow-sm rotate-[-90deg] origin-center">Trim: 6"</span>
        <span className="px-1.5 py-0.5 rounded bg-background border text-foreground shadow-sm rotate-[-90deg] origin-center">Safe: 5.875"</span>
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-muted-foreground">
      <div className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-destructive" /> Bleed Area — Red</div>
      <div className="flex items-center gap-2"><span className="h-3 w-3 rounded border border-foreground" /> Trim Size — Black Line</div>
      <div className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-primary" /> Safe Zone — Green</div>
      <div className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-accent" /> Mailing Area — Blue (Back)</div>
      <div className="flex items-center gap-2"><span className="h-3 w-3 rounded border-2 border-dashed border-muted-foreground" /> Offsets — Dotted Lines</div>
    </div>
  );
}

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

      {/* Bleed area */}
      <div className="absolute inset-0 rounded-sm bg-destructive/20" />

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

      <DimensionLabels />
    </div>
  );
}

function BackCanvas() {
  const bleedW = 9.25 * INCH_PX;
  const bleedH = 6.25 * INCH_PX;
  const trimInset = 0.125 * INCH_PX;
  const safeInsetFromTrim = 0.0625 * INCH_PX;
  const safeInset = trimInset + safeInsetFromTrim;

  // Mailing area: 4" x 2.375" positioned top-right within trim area
  const mailingW = 4 * INCH_PX;
  const mailingH = 2.375 * INCH_PX;
  const trimW = 9 * INCH_PX;
  const trimH = 6 * INCH_PX;

  const trimLeft = trimInset;
  const trimTop = trimInset;

  const mailingRightPadding = 0.375 * INCH_PX; // little padding from right edge within trim
  const mailingTopPadding = 0.5 * INCH_PX; // padding from top within trim

  const mailingLeft = trimLeft + (trimW - mailingW - mailingRightPadding);
  const mailingTop = trimTop + mailingTopPadding;

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

      {/* Bleed area */}
      <div className="absolute inset-0 rounded-sm bg-destructive/20" />

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

      {/* Mailing area (top-right) */}
      <div
        className="absolute rounded-sm bg-accent/40"
        style={{ left: mailingLeft, top: mailingTop, width: mailingW, height: mailingH }}
      />

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

      <DimensionLabels />
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
        <Legend />
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">6×9 in postcard technical template</div>
        <Button onClick={() => toast("Generating PDF template… (demo)")}>Generate PDF Template</Button>
      </div>
    </div>
  );
}

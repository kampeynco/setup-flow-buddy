import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [notifyMailings, setNotifyMailings] = useState(true);
  const [marketingUpdates, setMarketingUpdates] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="notifications" className="mt-2">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="style">Style</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="pt-4">
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-6">
                <div className="space-y-1.5">
                  <Label htmlFor="notify-mailings">Alerts for new mailings</Label>
                  <p className="text-sm text-muted-foreground">Receive an alert when a new mailing is sent.</p>
                </div>
                <Switch id="notify-mailings" checked={notifyMailings} onCheckedChange={setNotifyMailings} />
              </div>

              <div className="flex items-start justify-between gap-6">
                <div className="space-y-1.5">
                  <Label htmlFor="marketing-updates">Updates and marketing offers</Label>
                  <p className="text-sm text-muted-foreground">Get product updates and occasional marketing offers.</p>
                </div>
                <Switch id="marketing-updates" checked={marketingUpdates} onCheckedChange={setMarketingUpdates} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="style" className="pt-4">
            {/* intentionally left empty */}
          </TabsContent>
          <TabsContent value="billing" className="pt-4">
            {/* intentionally left empty */}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

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
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader as AlertHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cleanupAuthState } from "@/lib/utils";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [notifyMailings, setNotifyMailings] = useState(true);
  const [marketingUpdates, setMarketingUpdates] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    try {
      setDeleting(true);
      const { error } = await supabase.functions.invoke('delete-account', { body: {} });
      if (error) throw error;
      toast.success('Your account has been deleted.');
      cleanupAuthState();
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch {}
      window.location.href = '/auth?mode=signup';
    } catch (err) {
      console.error('Delete account error', err);
      toast.error('Failed to delete account. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] sm:h-[480px] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="notifications" className="flex gap-4 flex-1 min-h-0">
          <TabsList className="flex flex-col h-fit self-start flex-shrink-0">
            <TabsTrigger value="notifications" className="w-full justify-start">Notifications</TabsTrigger>
            <TabsTrigger value="style" className="w-full justify-start">Style</TabsTrigger>
            <TabsTrigger value="account" className="w-full justify-start">Account</TabsTrigger>
            <TabsTrigger value="pause" className="w-full justify-start">Pause</TabsTrigger>
            <TabsTrigger value="delete" className="w-full justify-start">Delete</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto min-h-0">
            <TabsContent value="notifications" className="mt-0 h-full">
              <div className="space-y-6">
                <div className="flex items-start justify-between gap-6">
                  <div className="space-y-1.5">
                    <Label htmlFor="marketing-updates">Updates and marketing offers</Label>
                    <p className="text-sm text-muted-foreground">Get product updates and occasional marketing offers.</p>
                  </div>
                  <Switch id="marketing-updates" checked={marketingUpdates} onCheckedChange={setMarketingUpdates} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="style" className="mt-0 h-full">
              {/* intentionally left empty */}
            </TabsContent>

            <TabsContent value="account" className="mt-0 h-full">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Committee Details</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="committee-name">Legal Committee Name</Label>
                      <Input id="committee-name" placeholder="Committee Name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="street">Street</Label>
                      <Input id="street" placeholder="123 Main St" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unit">Unit</Label>
                      <Input id="unit" placeholder="Suite 100" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="city">City</Label>
                      <Input id="city" placeholder="Anytown" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input id="state" placeholder="CA" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip">ZIP</Label>
                      <Input id="zip" placeholder="90210" />
                    </div>
                  </div>
                  <Button>Save Details</Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pause" className="mt-0 h-full">
              <div className="space-y-6">
                <div className="flex items-start justify-between gap-6">
                  <div className="space-y-1.5">
                    <Label htmlFor="notify-mailings">Pause mailings</Label>
                    <p className="text-sm text-muted-foreground">Turn off to pause all postcard mailings temporarily.</p>
                  </div>
                  <Switch id="notify-mailings" checked={notifyMailings} onCheckedChange={setNotifyMailings} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="delete" className="mt-0 h-full">
              <div className="space-y-6">
                <div className="rounded-md border p-4">
                  <h3 className="text-sm font-medium text-destructive">Delete account</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    This action is permanent and will remove your data. Type DELETE to confirm.
                  </p>
                  <div className="mt-4 space-y-3">
                    <Label htmlFor="confirm-delete">Type DELETE to confirm</Label>
                    <Input
                      id="confirm-delete"
                      placeholder="DELETE"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                    />

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={confirmText !== "DELETE" || deleting}>
                          {deleting ? "Deleting..." : "Delete account"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete your account and associated data. This cannot be undone.
                          </AlertDialogDescription>
                        </AlertHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteAccount} disabled={deleting}>
                            Confirm delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

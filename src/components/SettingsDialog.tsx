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
      window.location.href = '/auth';
    } catch (err) {
      console.error('Delete account error', err);
      toast.error('Failed to delete account. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="notifications" className="mt-2">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="style">Style</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="pt-4 min-h-[280px]">
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

          <TabsContent value="style" className="pt-4 min-h-[280px]">
            {/* intentionally left empty */}
          </TabsContent>
          <TabsContent value="billing" className="pt-4 min-h-[280px]">
            {/* intentionally left empty */}
          </TabsContent>

          <TabsContent value="account" className="pt-4 min-h-[280px]">
            <div className="space-y-4">
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
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

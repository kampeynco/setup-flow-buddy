import React, { useState, useEffect } from "react";
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

  // Profile/Sender form state
  const [profileLoading, setProfileLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [committeeName, setCommitteeName] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");

  // Notification preferences state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(true);
  const [statusUpdates, setStatusUpdates] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);

  // Fetch user profile data
  const fetchProfile = async () => {
    try {
      setProfileLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('committee_name, street_address, city, state, postal_code, email_notifications, marketing_emails, status_updates, weekly_digest')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      if (profile) {
        setCommitteeName(profile.committee_name || "");
        setStreet(profile.street_address || "");
        setCity(profile.city || "");
        setState(profile.state || "");
        setZip(profile.postal_code || "");
        
        // Set notification preferences
        setEmailNotifications(profile.email_notifications ?? true);
        setMarketingEmails(profile.marketing_emails ?? true);
        setStatusUpdates(profile.status_updates ?? true);
        setWeeklyDigest(profile.weekly_digest ?? true);
        setMarketingUpdates(profile.marketing_emails ?? false);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile data');
    } finally {
      setProfileLoading(false);
    }
  };

  // Save profile data
  const saveProfile = async () => {
    try {
      setSavingProfile(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          committee_name: committeeName,
          street_address: street,
          city: city,
          state: state,
          postal_code: zip
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error saving profile:', error);
        toast.error('Failed to save profile data');
        return;
      }

      toast.success('Profile data saved successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile data');
    } finally {
      setSavingProfile(false);
    }
  };

  // Save notification preferences
  const saveNotificationPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          email_notifications: emailNotifications,
          marketing_emails: marketingEmails,
          status_updates: statusUpdates,
          weekly_digest: weeklyDigest
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error saving notification preferences:', error);
        toast.error('Failed to save notification preferences');
        return;
      }

      // Sync contact with Loops.so
      try {
        await supabase.functions.invoke('send-loops-notification', {
          body: {
            action: 'update_contact',
            profileId: user.id,
            data: {
              subscribed: marketingEmails,
              emailNotifications: emailNotifications,
              statusUpdates: statusUpdates,
              weeklyDigest: weeklyDigest
            }
          }
        });
      } catch (loopsError) {
        console.error('Failed to sync with Loops:', loopsError);
        // Don't show error to user as the main preferences were saved
      }

      toast.success('Notification preferences saved');
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      toast.error('Failed to save notification preferences');
    }
  };

  // Load profile data when dialog opens
  useEffect(() => {
    if (open) {
      fetchProfile();
    }
  }, [open]);

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
      <DialogContent className="sm:max-w-[720px] sm:h-[640px] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="sender" className="flex gap-4 flex-1 min-h-0">
          <TabsList className="flex flex-col h-fit self-start flex-shrink-0">
            <TabsTrigger value="sender" className="w-full justify-start">Sender</TabsTrigger>
            <TabsTrigger value="notifications" className="w-full justify-start">Notifications</TabsTrigger>
            <TabsTrigger value="pause" className="w-full justify-start">Pause</TabsTrigger>
            <TabsTrigger value="delete" className="w-full justify-start">Delete</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto min-h-0">
            <TabsContent value="notifications" className="mt-0 h-full">
              <div className="space-y-6">
                <div className="flex items-start justify-between gap-6">
                  <div className="space-y-1.5">
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive all email notifications from the app.</p>
                  </div>
                  <Switch id="email-notifications" checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                </div>

                <div className="flex items-start justify-between gap-6">
                  <div className="space-y-1.5">
                    <Label htmlFor="marketing-emails">Marketing & Updates</Label>
                    <p className="text-sm text-muted-foreground">Get product updates and occasional marketing offers.</p>
                  </div>
                  <Switch id="marketing-emails" checked={marketingEmails} onCheckedChange={setMarketingEmails} />
                </div>

                <div className="flex items-start justify-between gap-6">
                  <div className="space-y-1.5">
                    <Label htmlFor="status-updates">Status Updates</Label>
                    <p className="text-sm text-muted-foreground">Get notified when donation and postcard status changes.</p>
                  </div>
                  <Switch id="status-updates" checked={statusUpdates} onCheckedChange={setStatusUpdates} />
                </div>

                <div className="flex items-start justify-between gap-6">
                  <div className="space-y-1.5">
                    <Label htmlFor="weekly-digest">Weekly Digest</Label>
                    <p className="text-sm text-muted-foreground">Receive weekly summary of donations and postcard activity.</p>
                  </div>
                  <Switch id="weekly-digest" checked={weeklyDigest} onCheckedChange={setWeeklyDigest} />
                </div>

                <Button onClick={saveNotificationPreferences} className="w-full">
                  Save Notification Preferences
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="sender" className="mt-0 h-full">
              <div className="space-y-6 max-w-md mx-auto">
                <div className="space-y-4">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="committee-name">Legal Committee Name</Label>
                      <Input 
                        id="committee-name" 
                        placeholder="Committee Name"
                        value={committeeName}
                        onChange={(e) => setCommitteeName(e.target.value)}
                        disabled={profileLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="street">Street</Label>
                      <Input 
                        id="street" 
                        placeholder="123 Main St"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        disabled={profileLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input 
                        id="city" 
                        placeholder="Anytown"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        disabled={profileLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input 
                        id="state" 
                        placeholder="CA"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        disabled={profileLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip">ZIP</Label>
                      <Input 
                        id="zip" 
                        placeholder="90210"
                        value={zip}
                        onChange={(e) => setZip(e.target.value)}
                        disabled={profileLoading}
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={saveProfile}
                    disabled={profileLoading || savingProfile}
                  >
                    {profileLoading ? "Loading..." : savingProfile ? "Saving..." : "Save Details"}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pause" className="mt-0 h-full">
              <div className="space-y-6">
                <div className="flex items-start justify-between gap-6">
                  <div className="space-y-1.5">
                    <Label htmlFor="notify-mailings">Pause mailings</Label>
                    <p className="text-sm text-muted-foreground">Turn on to pause all postcard mailings temporarily.</p>
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

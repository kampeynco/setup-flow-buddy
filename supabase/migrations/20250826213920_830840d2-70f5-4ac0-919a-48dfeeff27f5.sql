-- Add notification preferences and Loops tracking to profiles
ALTER TABLE public.profiles 
ADD COLUMN loops_contact_id text,
ADD COLUMN email_notifications boolean DEFAULT true,
ADD COLUMN marketing_emails boolean DEFAULT true,
ADD COLUMN status_updates boolean DEFAULT true,
ADD COLUMN weekly_digest boolean DEFAULT true;

-- Create notification events table to track what has been sent
CREATE TABLE public.notification_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_data jsonb,
  loops_sent boolean DEFAULT false,
  loops_event_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on notification_events
ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;

-- Create policies for notification_events
CREATE POLICY "Users can view their own notification events" 
ON public.notification_events 
FOR SELECT 
USING (auth.uid() = profile_id);

CREATE POLICY "Service role can manage notification events" 
ON public.notification_events 
FOR ALL 
USING (auth.role() = 'service_role'::text);

-- Add trigger for updated_at on notification_events
CREATE TRIGGER update_notification_events_updated_at
BEFORE UPDATE ON public.notification_events
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
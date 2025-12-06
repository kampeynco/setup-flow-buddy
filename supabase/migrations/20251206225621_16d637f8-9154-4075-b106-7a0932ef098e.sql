-- Add backpsc_message_template column for variable-based message templates
ALTER TABLE public.templates 
ADD COLUMN IF NOT EXISTS backpsc_message_template TEXT DEFAULT 'Dear %FIRST_NAME%,

Thank you for your generous donation! Your support makes our campaign possible.

With gratitude,
%SENDER_FULL_NAME%';
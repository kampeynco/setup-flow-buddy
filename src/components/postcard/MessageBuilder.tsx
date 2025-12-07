import { useRef, useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { VariableChip } from "./VariableChip";

const RECIPIENT_VARIABLES = [
  { variable: "%FULL_NAME%", label: "%FULL_NAME%" },
  { variable: "%FIRST_NAME%", label: "%FIRST_NAME%" },
  { variable: "%LAST_NAME%", label: "%LAST_NAME%" },
  { variable: "%ADDRESS%", label: "%ADDRESS%" },
  { variable: "%ADDRESS2%", label: "%ADDRESS2%" },
  { variable: "%CITY%", label: "%CITY%" },
  { variable: "%STATE%", label: "%STATE%" },
  { variable: "%ZIP%", label: "%ZIP%" },
  { variable: "%CURRENT_DAY%", label: "%CURRENT_DAY%" },
];

const SENDER_VARIABLES = [
  { variable: "%SENDER_FULL_NAME%", label: "%SENDER_FULL_NAME%" },
  { variable: "%SENDER_FIRST_NAME%", label: "%SENDER_FIRST_NAME%" },
  { variable: "%SENDER_EMAIL%", label: "%SENDER_EMAIL%" },
  { variable: "%SENDER_PHONE%", label: "%SENDER_PHONE%" },
];

interface MessageBuilderProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  className?: string;
}

export function MessageBuilder({ 
  value, 
  onChange, 
  maxLength = 500,
  className 
}: MessageBuilderProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPosition, setCursorPosition] = useState<number>(value.length);

  const handleVariableClick = (variable: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = value.slice(0, start) + variable + value.slice(end);
    
    onChange(newValue);
    
    // Set cursor position after the inserted variable
    const newCursorPosition = start + variable.length;
    setCursorPosition(newCursorPosition);
    
    // Focus and set cursor position after state update
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      onChange(newValue);
    }
  };

  return (
    <div className={className}>
      <div className="grid grid-cols-2 gap-6">
        {/* Left: Message Textarea */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Message</Label>
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={handleTextChange}
            placeholder="Write your thank you message. Click the variables on the right to insert them at the cursor position..."
            rows={12}
            className="font-mono text-sm resize-none"
          />
          <div className="flex justify-end">
            <span className="text-xs text-muted-foreground">
              {value.length}/{maxLength} characters
            </span>
          </div>
        </div>

        {/* Right: Variables */}
        <div className="space-y-4">
          {/* Recipient Variables */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Recipient Variables</Label>
            <div className="flex flex-wrap gap-2">
              {RECIPIENT_VARIABLES.map((v) => (
                <VariableChip
                  key={v.variable}
                  variable={v.variable}
                  label={v.label}
                  onClick={handleVariableClick}
                  variant="recipient"
                />
              ))}
            </div>
          </div>

          {/* Sender Variables */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Sender Variables</Label>
            <div className="flex flex-wrap gap-2">
              {SENDER_VARIABLES.map((v) => (
                <VariableChip
                  key={v.variable}
                  variable={v.variable}
                  label={v.label}
                  onClick={handleVariableClick}
                  variant="sender"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

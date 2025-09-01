import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cleanupAuthState } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import logoIcon from "@/assets/logo_icon_white.svg";

function useSEO({ title, description }: { title: string; description: string }) {
  useEffect(() => {
    document.title = title;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", description);
    else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = description;
      document.head.appendChild(m);
    }
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = window.location.href;
  }, [title, description]);
}


export default function Auth() {
  useSEO({
    title: "Login or Create Account – Thank Donors",
    description: "Sign in or sign up to Thank Donors. Reset your password via email if you've forgotten it.",
  });

  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  useEffect(() => {
    const checkUserAndRedirect = async (session: any) => {
      if (session?.user) {
        // Check if user has completed onboarding
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed, webhook_setup_completed')
          .eq('id', session.user.id)
          .single();

        if (profile?.onboarding_completed) {
          window.location.href = "/dashboard";
        } else if (profile?.webhook_setup_completed) {
          window.location.href = "/onboarding/step-1";
        } else {
          window.location.href = "/onboarding/webhook";
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      checkUserAndRedirect(session);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      checkUserAndRedirect(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Support query param ?mode=signup or ?mode=signin to set initial mode
    const params = new URLSearchParams(window.location.search);
    const m = params.get('mode');
    if (m === 'signup') setMode('signup');
    else if (m === 'signin') setMode('signin');

    // If redirected back from password recovery, show reset form
    const hash = window.location.hash || ""; // e.g. #access_token=...&type=recovery
    if (hash.includes("type=recovery")) {
      setMode("reset");
    }
  }, []);


  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      cleanupAuthState();
      try { await supabase.auth.signOut({ scope: 'global' }); } catch {}
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      // Check onboarding status
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed, webhook_setup_completed')
        .eq('id', data.user.id)
        .single();

      toast.success("Signed in");
      
      if (profile?.onboarding_completed) {
        window.location.href = "/dashboard";
      } else if (profile?.webhook_setup_completed) {
        window.location.href = "/onboarding/step-1";
      } else {
        window.location.href = "/onboarding/webhook";
      }
    } catch (err: any) {
      toast.error(err?.message || "Unable to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (password.length < 6) throw new Error("Password must be at least 6 characters");
      if (password !== confirmPassword) throw new Error("Passwords do not match");

      const redirectUrl = `${window.location.origin}/auth`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectUrl },
      });
      if (error) throw error;
      toast.success("Check your email to confirm your account");
      setMode("signin");
    } catch (err: any) {
      toast.error(err?.message || "Unable to sign up");
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const redirectTo = `${window.location.origin}/auth`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      toast.success("Password reset email sent");
      setMode("signin");
    } catch (err: any) {
      toast.error(err?.message || "Unable to send reset email");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (newPassword.length < 6) throw new Error("Password must be at least 6 characters");
      if (newPassword !== confirmPassword) throw new Error("Passwords do not match");
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password updated. Please sign in.");
      // Clear inputs and go back to sign in
      setPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMode("signin");
    } catch (err: any) {
      toast.error(err?.message || "Unable to reset password");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center p-4" 
         style={{
           background: 'linear-gradient(180deg, rgba(3, 101, 199, 1) 70%, rgba(255, 255, 255, 1) 100%)'
         }}>
      <main className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 font-sans text-2xl font-semibold text-white hover:text-white/90 transition-colors" aria-label="Thank Donors Home">
            <img src={logoIcon} alt="Thank Donors logo icon" className="h-10 w-10" />
            <span>Thank Donors</span>
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              {mode === "signin" && "Sign in to Thank Donors"}
              {mode === "signup" && "Create your account"}
              {mode === "forgot" && "Reset your password"}
              {mode === "reset" && "Set a new password"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mode !== "forgot" && (
              <form onSubmit={mode === "signin" ? handleSignIn : handleSignUp} className="space-y-4" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input 
                      id="password" 
                      type={showPassword ? "text" : "password"} 
                      autoComplete={mode === "signin" ? "current-password" : "new-password"} 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      className="pr-10"
                      required 
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                {mode === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password-signup">Confirm password</Label>
                    <div className="relative">
                      <Input 
                        id="confirm-password-signup" 
                        type={showConfirmPassword ? "text" : "password"} 
                        autoComplete="new-password" 
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                        className="pr-10"
                        required 
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <button type="button" className="underline underline-offset-4" onClick={() => setMode("forgot")}>
                    Forgot password?
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      {mode === "signin" ? "No account?" : "Have an account?"}
                    </span>
                    <button type="button" className="underline underline-offset-4" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
                      {mode === "signin" ? "Sign up" : "Sign in"}
                    </button>
                  </div>
                </div>
                <Button type="submit" variant="yellow" className="w-full" disabled={loading}>
                  {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
                </Button>
              </form>
            )}

            {mode === "forgot" && (
              <form onSubmit={handleForgot} className="space-y-4" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input id="reset-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <button type="button" className="underline underline-offset-4" onClick={() => setMode("signin")}>
                    Back to sign in
                  </button>
                </div>
                <Button type="submit" variant="yellow" className="w-full" disabled={loading}>
                  {loading ? "Sending…" : "Send reset link"}
                </Button>
              </form>
            )}
            {mode === "reset" && (
              <form onSubmit={handleReset} className="space-y-4" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New password</Label>
                  <div className="relative">
                    <Input 
                      id="new-password" 
                      type={showNewPassword ? "text" : "password"} 
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)} 
                      className="pr-10"
                      required 
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm new password</Label>
                  <div className="relative">
                    <Input 
                      id="confirm-password" 
                      type={showConfirmNewPassword ? "text" : "password"} 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)} 
                      className="pr-10"
                      required 
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                    >
                      {showConfirmNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <button type="button" className="underline underline-offset-4" onClick={() => setMode("signin")}>
                    Back to sign in
                  </button>
                </div>
                <Button type="submit" variant="yellow" className="w-full" disabled={loading}>
                  {loading ? "Updating…" : "Update password"}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center text-sm text-muted-foreground">
              By continuing, you agree to our <Link to="#" className="underline underline-offset-4">Terms</Link> and <Link to="#" className="underline underline-offset-4">Privacy Policy</Link>.
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

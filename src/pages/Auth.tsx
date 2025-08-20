import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cleanupAuthState } from "@/lib/utils";
import logoIcon from "@/assets/logo_icon_white.svg";
import logoIconRegular from "@/assets/logo_icon_regular.svg";

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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        // Redirect authenticated users
        window.location.href = "/dashboard";
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        window.location.href = "/dashboard";
      }
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
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Signed in");
      window.location.href = "/dashboard";
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
    <div className="min-h-screen flex flex-col" 
         style={{
           background: 'linear-gradient(180deg, rgba(3, 101, 199, 1) 70%, rgba(255, 255, 255, 1) 100%)'
         }}>
      <header className={`${scrolled ? "sticky top-0" : "absolute top-0 left-0 right-0"} z-50 transition-colors ${scrolled ? "bg-card/95 backdrop-blur-sm text-foreground" : "bg-transparent text-white"}`}>
        <div className="mx-auto max-w-[1024px] px-4 sm:px-6 lg:px-0 py-3 flex items-center justify-between relative z-10">
          <Link to="/" className="flex items-center gap-2 font-sans text-lg font-semibold" aria-label="Thank Donors Home">
            <img src={scrolled ? logoIconRegular : logoIcon} alt="Thank Donors logo icon" className="h-6 w-6" />
            <span>Thank Donors</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link to="/#features" className={scrolled ? "text-foreground/80 hover:text-foreground" : "text-white/80 hover:text-white"}>Features</Link>
            <Link to="/#how" className={scrolled ? "text-foreground/80 hover:text-foreground" : "text-white/80 hover:text-white"}>How it works</Link>
            <Link to="/#pricing" className={scrolled ? "text-foreground/80 hover:text-foreground" : "text-white/80 hover:text-white"}>Pricing</Link>
            <Link to="/#faq" className={scrolled ? "text-foreground/80 hover:text-foreground" : "text-white/80 hover:text-white"}>FAQ</Link>
          </nav>
          <div className="flex items-center gap-2">
            {mode !== "signin" && (
              <button
                onClick={() => setMode("signin")}
                className={`hidden sm:inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-white/20 h-10 px-4 py-2 ${scrolled ? "" : "text-white"}`}
              >
                Login
              </button>
            )}
            {mode !== "signup" && (
              <button
                onClick={() => setMode("signup")}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium bg-[#ffc600] text-black hover:bg-[#ffc600]/90 font-semibold h-10 px-4 py-2"
              >
                Create Free Account
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4 pt-20">
      <main className="w-full max-w-md">
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
                  <Input id="password" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                {mode === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password-signup">Confirm password</Label>
                    <Input id="confirm-password-signup" type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
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
                  <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm new password</Label>
                  <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
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
    </div>
  );
}

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LogIn, UserPlus, Check, ArrowLeft, ArrowRight, ShieldCheck, ShieldAlert } from "lucide-react";
import logo from "@/assets/logo.svg";
import { AddressPicker, emptyAddress, type AddressValue } from "@/components/AddressPicker";
import { lovable } from "@/integrations/lovable";

// Strict email: standard local@domain.tld, no spaces, valid TLD chars
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
// Strict Uganda phone — accepts +2567XXXXXXXX, 2567XXXXXXXX, or 07XXXXXXXX (mobile only: 7)
const UG_PHONE_RE = /^(?:\+?256|0)?7\d{8}$/;
const normalizeUgPhone = (raw: string) => {
  const digits = raw.replace(/[^\d+]/g, "");
  const m = digits.match(/^(?:\+?256|0)?(7\d{8})$/);
  return m ? `+256${m[1]}` : null;
};

const INTERESTS = [
  "Daily reminders", "Live lectures", "Quran tafsir", "Charity & sadaqah",
  "Mosque events", "Halal businesses", "Education", "Family & parenting",
];

const TOTAL_STEPS = 4;

const scorePassword = (pw: string) => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
};

const STRENGTH = ["Too weak", "Weak", "Fair", "Strong", "Very strong"];
const STRENGTH_COLOR = ["bg-destructive", "bg-destructive", "bg-amber-500", "bg-primary", "bg-primary"];

const AuthPage = () => {
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [preferredMosque, setPreferredMosque] = useState("");
  const [address, setAddress] = useState<AddressValue>(emptyAddress);
  const [interests, setInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const pwScore = useMemo(() => scorePassword(password), [password]);
  const pwValid =
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    pwScore >= 3;

  const toggleInterest = (val: string) => {
    setInterests((prev) => (prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]));
  };

  const canProceed = () => {
    if (step === 1) return displayName.trim().length >= 2 && UG_PHONE_RE.test(phone.trim()) && EMAIL_RE.test(email.trim());
    if (step === 2) return !!address.region && !!address.district && !!address.constituency && !!address.subcounty && !!address.parish;
    if (step === 3) return pwValid && password === confirmPassword;
    return true;
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
      if (result.error) {
        toast.error(result.error.message || "Google sign-in failed");
        setLoading(false);
        return;
      }
      // result.redirected handled by browser navigation; OnboardingGate enforces address step
    } catch (err: any) {
      toast.error(err?.message || "Google sign-in failed");
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      toast.success("Welcome back!");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    const normalizedPhone = normalizeUgPhone(phone);
    if (!normalizedPhone) {
      toast.error("Enter a valid Ugandan phone number, e.g. +256 7XX XXX XXX");
      return;
    }
    setLoading(true);
    try {
      await signUp(email.trim(), password, displayName);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").upsert(
          { user_id: user.id, display_name: displayName.trim(), phone: normalizedPhone },
          { onConflict: "user_id" }
        );
        await supabase.from("user_preferences").upsert(
          {
            user_id: user.id,
            location_city: city.trim() || address.district || null,
            region: address.region || null,
            district: address.district || null,
            constituency: address.constituency || null,
            subcounty: address.subcounty || null,
            parish: address.parish || null,
            village: address.village || null,
            interests,
            business_description: preferredMosque.trim() ? `Preferred mosque: ${preferredMosque.trim()}` : null,
          },
          { onConflict: "user_id" }
        );
      }
      toast.success("Account created! Let's finish setting up.");
      navigate("/onboarding");
    } catch (err: any) {
      toast.error(err.message || "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (!canProceed()) return;
    if (step < TOTAL_STEPS) setStep(step + 1);
    else handleSignUp();
  };

  const stepMeta = [
    { n: 1, label: "Identity" },
    { n: 2, label: "Address" },
    { n: 3, label: "Security" },
    { n: 4, label: "Interests" },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Card className="border-border/60 shadow-xl">
          <CardHeader className="text-center">
            <img src={logo} alt="UmmahLink" className="mx-auto mb-3 h-24 w-24 bg-transparent" />

            <CardTitle className="font-display text-2xl">
              {mode === "signin"
                ? "Welcome Back"
                : step === 1
                ? "Join UmmahLink"
                : step === 2
                ? "Your full address"
                : step === 3
                ? "Secure your account"
                : "Personalize"}
            </CardTitle>
            <CardDescription>
              {mode === "signin"
                ? "Sign in to your account"
                : step === 1
                ? "Tell us who you are"
                : step === 2
                ? "Region, district & constituency in Uganda"
                : step === 3
                ? "Choose a strong password"
                : "Help us tailor your experience"}
            </CardDescription>
            {mode === "signup" && (
              <div className="mt-5 px-2">
                <div className="relative flex items-center justify-between">
                  <div className="absolute left-4 right-4 top-4 h-0.5 bg-muted" />
                  <div
                    className="absolute left-4 top-4 h-0.5 bg-primary transition-all duration-300"
                    style={{ width: `calc((100% - 2rem) * ${(step - 1) / (TOTAL_STEPS - 1)})` }}
                  />
                  {stepMeta.map((s) => {
                    const done = step > s.n;
                    const active = step === s.n;
                    return (
                      <div key={s.n} className="relative z-10 flex flex-col items-center gap-1.5">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all ${
                            done
                              ? "border-primary bg-primary text-primary-foreground"
                              : active
                              ? "border-primary bg-background text-primary ring-4 ring-primary/15"
                              : "border-muted bg-background text-muted-foreground"
                          }`}
                        >
                          {done ? <Check className="h-4 w-4" /> : s.n}
                        </div>
                        <span
                          className={`text-[10px] font-medium ${
                            active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardHeader>


          <CardContent>
            {mode === "signin" ? (
              <form onSubmit={handleSignIn} className="space-y-3">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" variant="hero" className="w-full gap-2" disabled={loading}>
                  {loading ? "..." : <><LogIn className="h-4 w-4" /> Sign In</>}
                </Button>
                <div className="text-center">
                  <Button type="button" variant="link" onClick={() => { setMode("signup"); setStep(1); }} className="text-sm">
                    New here? Create an account
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    {step === 1 && (
                      <>
                        <div>
                          <Label htmlFor="displayName">Full name</Label>
                          <Input
                            id="displayName"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="e.g. Aisha Nakato" className="placeholder-elegant"
                            maxLength={80}
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone number</Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+256 7XX XXX XXX" className="placeholder-elegant"
                            maxLength={20}
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com" className="placeholder-elegant"
                          />
                        </div>
                      </>
                    )}

                    {step === 2 && (
                      <AddressPicker value={address} onChange={setAddress} />
                    )}

                    {step === 3 && (
                      <>
                        <div>
                          <Label htmlFor="password">Password</Label>
                          <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="At least 8 characters" className="placeholder-elegant"
                            minLength={8}
                          />
                          {password && (
                            <div className="mt-2 space-y-1.5">
                              <div className="flex h-1.5 gap-1">
                                {[0, 1, 2, 3].map((i) => (
                                  <div
                                    key={i}
                                    className={`flex-1 rounded-full transition-colors ${
                                      i < pwScore ? STRENGTH_COLOR[pwScore] : "bg-muted"
                                    }`}
                                  />
                                ))}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs">
                                {pwValid ? (
                                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                                ) : (
                                  <ShieldAlert className="h-3.5 w-3.5 text-muted-foreground" />
                                )}
                                <span className={pwValid ? "text-primary" : "text-muted-foreground"}>
                                  {STRENGTH[pwScore]}
                                </span>
                              </div>
                              <ul className="space-y-0.5 text-xs text-muted-foreground">
                                <li className={password.length >= 8 ? "text-primary" : ""}>• 8+ characters</li>
                                <li className={/[A-Z]/.test(password) && /[a-z]/.test(password) ? "text-primary" : ""}>
                                  • Upper &amp; lowercase letters
                                </li>
                                <li className={/\d/.test(password) ? "text-primary" : ""}>• At least one number</li>
                                <li className={/[^A-Za-z0-9]/.test(password) ? "text-primary" : ""}>
                                  • Symbol recommended
                                </li>
                              </ul>
                            </div>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="confirm">Confirm password</Label>
                          <Input
                            id="confirm"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter password" className="placeholder-elegant"
                          />
                          {confirmPassword && password !== confirmPassword && (
                            <p className="mt-1 text-xs text-destructive">Passwords don't match</p>
                          )}
                        </div>
                      </>
                    )}

                    {step === 4 && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="city">Location</Label>
                            <Input
                              id="city"
                              value={city}
                              onChange={(e) => setCity(e.target.value)}
                              placeholder="Kampala" className="placeholder-elegant"
                              maxLength={80}
                            />
                          </div>
                          <div>
                            <Label htmlFor="mosque">Preferred mosque</Label>
                            <Input
                              id="mosque"
                              value={preferredMosque}
                              onChange={(e) => setPreferredMosque(e.target.value)}
                              placeholder="e.g. Kibuli" className="placeholder-elegant"
                              maxLength={100}
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Community interests</Label>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {INTERESTS.map((i) => {
                              const active = interests.includes(i);
                              return (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => toggleInterest(i)}
                                  className={`rounded-full border px-2.5 py-1 text-xs transition-all ${
                                    active
                                      ? "border-primary bg-primary text-primary-foreground"
                                      : "border-border bg-background hover:bg-accent"
                                  }`}
                                >
                                  {active && <Check className="mr-1 inline h-3 w-3" />}
                                  {i}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>

                <div className="flex items-center justify-between gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => (step > 1 ? setStep(step - 1) : setMode("signin"))}
                    disabled={loading}
                  >
                    {step > 1 ? <><ArrowLeft className="mr-1 h-4 w-4" /> Back</> : "Sign in instead"}
                  </Button>
                  <Button
                    type="button"
                    variant="hero"
                    onClick={handleNext}
                    disabled={!canProceed() || loading}
                    className="gap-1"
                  >
                    {loading ? "..." : step === TOTAL_STEPS ? <><UserPlus className="h-4 w-4" /> Create account</> : <>Next <ArrowRight className="h-4 w-4" /></>}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AuthPage;

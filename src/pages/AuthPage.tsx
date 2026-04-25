import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LogIn, UserPlus, Check } from "lucide-react";
import logo from "@/assets/logo.svg";

const INTERESTS = [
  "Daily reminders", "Live lectures", "Quran tafsir", "Charity & sadaqah",
  "Mosque events", "Halal businesses", "Education", "Family & parenting",
];

const AuthPage = () => {
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [preferredMosque, setPreferredMosque] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const toggleInterest = (val: string) => {
    setInterests((prev) => (prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        if (!displayName.trim()) throw new Error("Please enter your name");
        await signUp(email, password, displayName);
        // Wait briefly for session, then save profile + preferences
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("profiles").upsert(
            { user_id: user.id, display_name: displayName.trim(), phone: phone.trim() || null },
            { onConflict: "user_id" }
          );
          await supabase.from("user_preferences").upsert(
            {
              user_id: user.id,
              location_city: city.trim() || null,
              interests,
              business_description: preferredMosque.trim() ? `Preferred mosque: ${preferredMosque.trim()}` : null,
            },
            { onConflict: "user_id" }
          );
        }
        toast.success("Account created! Let's finish setting up.");
        navigate("/onboarding");
      } else {
        await signIn(email, password);
        toast.success("Welcome back!");
        navigate("/");
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Card className="border-border/60 shadow-xl">
          <CardHeader className="text-center">
            <img src={logo} alt="UmmahLink" className="mx-auto mb-2 h-14 w-14 rounded-xl" />
            <CardTitle className="font-display text-2xl">
              {isSignUp ? "Join UmmahLink" : "Welcome Back"}
            </CardTitle>
            <CardDescription>
              {isSignUp ? "Create your account to connect with the ummah" : "Sign in to your account"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <AnimatePresence mode="wait">
                {isSignUp && (
                  <motion.div
                    key="signup-fields"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 overflow-hidden"
                  >
                    <div>
                      <Label htmlFor="displayName">Full name</Label>
                      <Input
                        id="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="e.g. Aisha Nakato"
                        maxLength={80}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+256 7XX XXX XXX"
                        maxLength={20}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              <AnimatePresence>
                {isSignUp && (
                  <motion.div
                    key="extras"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="city">Location</Label>
                        <Input
                          id="city"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="Kampala"
                          maxLength={80}
                        />
                      </div>
                      <div>
                        <Label htmlFor="mosque">Preferred mosque</Label>
                        <Input
                          id="mosque"
                          value={preferredMosque}
                          onChange={(e) => setPreferredMosque(e.target.value)}
                          placeholder="e.g. Kibuli"
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
                  </motion.div>
                )}
              </AnimatePresence>

              <Button type="submit" variant="hero" className="w-full gap-2" disabled={loading}>
                {loading ? "..." : isSignUp ? <><UserPlus className="h-4 w-4" /> Create account</> : <><LogIn className="h-4 w-4" /> Sign In</>}
              </Button>
            </form>
            <div className="mt-3 text-center">
              <Button variant="link" onClick={() => setIsSignUp(!isSignUp)} className="text-sm">
                {isSignUp ? "Already have an account? Sign In" : "New here? Create an account"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AuthPage;

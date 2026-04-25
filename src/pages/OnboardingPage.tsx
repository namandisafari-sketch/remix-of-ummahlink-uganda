import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Sparkles, Check } from "lucide-react";
import logo from "@/assets/logo.svg";
import { AddressPicker, emptyAddress, type AddressValue } from "@/components/AddressPicker";

const UG_PHONE_RE = /^(?:\+?256|0)?7\d{8}$/;
const normalizeUgPhone = (raw: string) => {
  const digits = raw.replace(/[^\d+]/g, "");
  const m = digits.match(/^(?:\+?256|0)?(7\d{8})$/);
  return m ? `+256${m[1]}` : null;
};

const REFERRAL_SOURCES = [
  "Friend or family",
  "Mosque / Imam",
  "Social media (Facebook, TikTok, X)",
  "WhatsApp group",
  "Search engine",
  "Event or community gathering",
  "Other",
];

const HOBBIES = [
  "Quran recitation", "Islamic studies", "Reading", "Sports", "Cooking",
  "Travel", "Photography", "Volunteering", "Tech & coding", "Music & nasheeds",
  "Farming", "Fashion", "Crafts", "Writing",
];

const INTERESTS = [
  "Daily reminders", "Live lectures", "Quran tafsir", "Charity & sadaqah",
  "Local news", "Mosque events", "Halal businesses", "Education & scholarships",
  "Health & wellness", "Family & parenting",
];

const BUSINESS_CATEGORIES = [
  "Food & restaurant", "Retail / Shop", "Fashion & clothing", "Beauty & cosmetics",
  "Education / School", "Health services", "Construction", "Transport",
  "Agriculture", "Tech / Digital services", "Media", "Other",
];

const AGE_RANGES = ["Under 18", "18-24", "25-34", "35-44", "45-54", "55+"];

const TOTAL_STEPS = 6;

const OnboardingPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(true);

  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState<AddressValue>(emptyAddress);
  const [referralSource, setReferralSource] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [locationCity, setLocationCity] = useState("");
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [accountPurpose, setAccountPurpose] = useState<"experience" | "business" | "">("");
  const [businessName, setBusinessName] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    (async () => {
      const [{ data: pref }, { data: prof }] = await Promise.all([
        supabase.from("user_preferences").select("onboarding_completed, region, district, constituency, subcounty, parish, village").eq("user_id", user.id).maybeSingle(),
        supabase.from("profiles").select("phone").eq("user_id", user.id).maybeSingle(),
      ]);
      if (pref?.onboarding_completed) {
        navigate("/", { replace: true });
        return;
      }
      if (prof?.phone) setPhone(prof.phone);
      if (pref?.region) {
        setAddress({
          region: pref.region || "",
          district: pref.district || "",
          constituency: pref.constituency || "",
          subcounty: pref.subcounty || "",
          parish: pref.parish || "",
          village: pref.village || "",
        });
      }
      setChecking(false);
    })();
  }, [user, authLoading, navigate]);

  const toggle = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  };

  const canProceed = () => {
    if (step === 1) {
      return UG_PHONE_RE.test(phone.trim()) &&
        !!address.region && !!address.district && !!address.constituency &&
        !!address.subcounty && !!address.parish;
    }
    if (step === 2) return !!referralSource && !!ageRange;
    if (step === 3) return hobbies.length > 0;
    if (step === 4) return interests.length > 0;
    if (step === 5) return !!accountPurpose;
    if (step === 6) return accountPurpose === "experience" || (!!businessName && !!businessCategory);
    return false;
  };

  const handleNext = () => {
    if (step === 5 && accountPurpose === "experience") return handleSubmit();
    if (step < TOTAL_STEPS) setStep(step + 1);
    else handleSubmit();
  };

  const handleSubmit = async () => {
    if (!user) return;
    const normalizedPhone = normalizeUgPhone(phone);
    if (!normalizedPhone) {
      toast.error("Enter a valid Ugandan phone number");
      setStep(1);
      return;
    }
    setSubmitting(true);
    // Save phone on profile
    await supabase.from("profiles").upsert(
      { user_id: user.id, phone: normalizedPhone },
      { onConflict: "user_id" }
    );
    const { error } = await supabase.from("user_preferences").upsert(
      {
        user_id: user.id,
        region: address.region || null,
        district: address.district || null,
        constituency: address.constituency || null,
        subcounty: address.subcounty || null,
        parish: address.parish || null,
        village: address.village || null,
        referral_source: referralSource || null,
        age_range: ageRange || null,
        location_city: locationCity.trim() || address.district || null,
        hobbies,
        interests,
        account_purpose: accountPurpose || null,
        has_business: accountPurpose === "business",
        business_name: businessName.trim() || null,
        business_category: businessCategory || null,
        business_description: businessDescription.trim() || null,
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome to UmmahLink! 🌙");
    navigate("/", { replace: true });
  };

  if (authLoading || checking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const progress = (step / TOTAL_STEPS) * 100;

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
        <Card className="overflow-hidden">
          <CardHeader className="text-center">
            <img src={logo} alt="UmmahLink" className="mx-auto mb-2 h-12 w-12 rounded-xl" />
            <div className="mb-2 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Step {step} of {TOTAL_STEPS}</span>
            </div>
            <Progress value={progress} className="h-1.5" />
            <CardTitle className="font-display mt-3 text-xl">
              {step === 1 && "Your address & phone"}
              {step === 2 && "Welcome! Tell us about you"}
              {step === 3 && "What do you enjoy?"}
              {step === 4 && "What interests you most?"}
              {step === 5 && "Why are you joining?"}
              {step === 6 && "Tell us about your business"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Required so we can serve your community"}
              {step === 2 && "This helps us personalize your experience"}
              {step === 3 && "Pick your hobbies — choose any that apply"}
              {step === 4 && "We'll tailor content to what matters to you"}
              {step === 5 && "We're building a community + simple ad service"}
              {step === 6 && "We'll connect you with the right audience"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {step === 1 && (
                  <>
                    <div className="space-y-2">
                      <Label>How did you find us?</Label>
                      <RadioGroup value={referralSource} onValueChange={setReferralSource}>
                        {REFERRAL_SOURCES.map((src) => (
                          <label
                            key={src}
                            className="flex cursor-pointer items-center gap-3 rounded-md border p-2.5 text-sm transition-colors hover:bg-accent"
                          >
                            <RadioGroupItem value={src} />
                            <span>{src}</span>
                          </label>
                        ))}
                      </RadioGroup>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Age range</Label>
                        <select
                          value={ageRange}
                          onChange={(e) => setAgeRange(e.target.value)}
                          className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        >
                          <option value="">Select...</option>
                          {AGE_RANGES.map((a) => <option key={a} value={a}>{a}</option>)}
                        </select>
                      </div>
                      <div>
                        <Label>City (optional)</Label>
                        <Input
                          value={locationCity}
                          onChange={(e) => setLocationCity(e.target.value)}
                          placeholder="e.g. Kampala"
                          maxLength={80}
                        />
                      </div>
                    </div>
                  </>
                )}

                {step === 2 && (
                  <div className="flex flex-wrap gap-2">
                    {HOBBIES.map((h) => {
                      const active = hobbies.includes(h);
                      return (
                        <button
                          key={h}
                          type="button"
                          onClick={() => toggle(hobbies, setHobbies, h)}
                          className={`rounded-full border px-3 py-1.5 text-sm transition-all ${
                            active
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background hover:bg-accent"
                          }`}
                        >
                          {active && <Check className="mr-1 inline h-3 w-3" />}
                          {h}
                        </button>
                      );
                    })}
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-2">
                    {INTERESTS.map((i) => {
                      const active = interests.includes(i);
                      return (
                        <label
                          key={i}
                          className="flex cursor-pointer items-center gap-3 rounded-md border p-2.5 text-sm transition-colors hover:bg-accent"
                        >
                          <Checkbox
                            checked={active}
                            onCheckedChange={() => toggle(interests, setInterests, i)}
                          />
                          <span>{i}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {step === 4 && (
                  <RadioGroup value={accountPurpose} onValueChange={(v) => setAccountPurpose(v as any)}>
                    <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-accent">
                      <RadioGroupItem value="experience" className="mt-1" />
                      <div>
                        <div className="font-medium">I'm here for the experience</div>
                        <div className="text-sm text-muted-foreground">
                          Connect with the ummah, get reminders, donate, find mosques
                        </div>
                      </div>
                    </label>
                    <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-accent">
                      <RadioGroupItem value="business" className="mt-1" />
                      <div>
                        <div className="font-medium">I have a business</div>
                        <div className="text-sm text-muted-foreground">
                          I may want to promote products/services to the community
                        </div>
                      </div>
                    </label>
                  </RadioGroup>
                )}

                {step === 5 && (
                  <>
                    <div>
                      <Label>Business name</Label>
                      <Input
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="e.g. Barakah Foods"
                        maxLength={100}
                      />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <select
                        value={businessCategory}
                        onChange={(e) => setBusinessCategory(e.target.value)}
                        className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="">Select category...</option>
                        {BUSINESS_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label>Brief description (optional)</Label>
                      <Textarea
                        value={businessDescription}
                        onChange={(e) => setBusinessDescription(e.target.value)}
                        placeholder="What do you offer?"
                        maxLength={300}
                        rows={3}
                      />
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center justify-between gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => (step > 1 ? setStep(step - 1) : handleSkip())}
                disabled={submitting}
              >
                {step > 1 ? <><ArrowLeft className="mr-1 h-4 w-4" /> Back</> : "Skip for now"}
              </Button>
              <Button onClick={handleNext} disabled={!canProceed() || submitting} className="gap-1">
                {submitting ? "Saving..." : (step === TOTAL_STEPS || (step === 4 && accountPurpose === "experience")) ? "Finish" : <>Next <ArrowRight className="h-4 w-4" /></>}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default OnboardingPage;

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Pesapal V3 sandbox: https://cybqa.pesapal.com/pesapalv3
// Pesapal V3 live: https://pay.pesapal.com/v3
const PESAPAL_BASE = "https://pay.pesapal.com/v3";

async function getPesapalToken(): Promise<string> {
  const consumerKey = Deno.env.get("PESAPAL_CONSUMER_KEY");
  const consumerSecret = Deno.env.get("PESAPAL_CONSUMER_SECRET");
  if (!consumerKey || !consumerSecret) {
    throw new Error("Pesapal credentials not configured");
  }

  const res = await fetch(`${PESAPAL_BASE}/api/Auth/RequestToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      consumer_key: consumerKey,
      consumer_secret: consumerSecret,
    }),
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(`Pesapal auth failed: ${JSON.stringify(data)}`);
  }
  return data.token;
}

async function registerIPN(token: string, callbackUrl: string): Promise<string> {
  const res = await fetch(`${PESAPAL_BASE}/api/URLSetup/RegisterIPN`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      url: callbackUrl,
      ipn_notification_type: "GET",
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`IPN registration failed: ${JSON.stringify(data)}`);
  return data.ipn_id;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const body = await req.json();
    const { project_id, amount, phone, donor_name } = body;

    if (!project_id || !amount || !phone) {
      return new Response(
        JSON.stringify({ error: "project_id, amount, and phone are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create donation record
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: donation, error: insertError } = await adminClient
      .from("donations")
      .insert({
        user_id: userId,
        project_id,
        amount: Number(amount),
        phone,
        donor_name: donor_name || null,
        status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to create donation: ${insertError.message}`);
    }

    // Get Pesapal token
    const pesapalToken = await getPesapalToken();

    // Register IPN callback
    const callbackUrl = `${supabaseUrl}/functions/v1/pesapal-callback`;
    const ipnId = await registerIPN(pesapalToken, callbackUrl);

    // Submit order
    const orderRes = await fetch(`${PESAPAL_BASE}/api/Transactions/SubmitOrderRequest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${pesapalToken}`,
      },
      body: JSON.stringify({
        id: donation.id,
        currency: "UGX",
        amount: Number(amount),
        description: `Donation to mosque project`,
        callback_url: `${supabaseUrl}/functions/v1/pesapal-callback?donation_id=${donation.id}`,
        notification_id: ipnId,
        billing_address: {
          phone_number: phone,
          first_name: donor_name || "Donor",
        },
      }),
    });

    const orderData = await orderRes.json();
    if (!orderRes.ok) {
      throw new Error(`Pesapal order failed: ${JSON.stringify(orderData)}`);
    }

    // Save tracking ID
    await adminClient
      .from("donations")
      .update({ pesapal_order_tracking_id: orderData.order_tracking_id })
      .eq("id", donation.id);

    return new Response(
      JSON.stringify({
        redirect_url: orderData.redirect_url,
        order_tracking_id: orderData.order_tracking_id,
        donation_id: donation.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Pesapal payment error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

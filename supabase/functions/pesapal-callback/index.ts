import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PESAPAL_BASE = "https://pay.pesapal.com/v3";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const orderTrackingId = url.searchParams.get("OrderTrackingId");
    const orderMerchantReference = url.searchParams.get("OrderMerchantReference");
    const donationId = url.searchParams.get("donation_id");

    console.log("Pesapal callback received:", { orderTrackingId, orderMerchantReference, donationId });

    if (!orderTrackingId) {
      return new Response(JSON.stringify({ error: "Missing OrderTrackingId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get Pesapal token
    const consumerKey = Deno.env.get("PESAPAL_CONSUMER_KEY")!;
    const consumerSecret = Deno.env.get("PESAPAL_CONSUMER_SECRET")!;

    const authRes = await fetch(`${PESAPAL_BASE}/api/Auth/RequestToken`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ consumer_key: consumerKey, consumer_secret: consumerSecret }),
    });
    const authData = await authRes.json();

    // Check transaction status
    const statusRes = await fetch(
      `${PESAPAL_BASE}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${authData.token}`,
        },
      }
    );
    const statusData = await statusRes.json();
    console.log("Pesapal transaction status:", statusData);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Map Pesapal status codes
    let dbStatus = "pending";
    if (statusData.payment_status_description === "Completed") {
      dbStatus = "completed";
    } else if (statusData.payment_status_description === "Failed") {
      dbStatus = "failed";
    } else if (statusData.payment_status_description === "Cancelled") {
      dbStatus = "cancelled";
    }

    // Update donation
    const identifier = donationId || orderMerchantReference;
    if (identifier) {
      await adminClient
        .from("donations")
        .update({
          status: dbStatus,
          pesapal_order_tracking_id: orderTrackingId,
          pesapal_transaction_id: statusData.confirmation_code || null,
        })
        .eq("id", identifier);
    } else {
      // Fallback: find by tracking ID
      await adminClient
        .from("donations")
        .update({
          status: dbStatus,
          pesapal_transaction_id: statusData.confirmation_code || null,
        })
        .eq("pesapal_order_tracking_id", orderTrackingId);
    }

    return new Response(
      JSON.stringify({ status: dbStatus, message: "Callback processed" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Pesapal callback error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

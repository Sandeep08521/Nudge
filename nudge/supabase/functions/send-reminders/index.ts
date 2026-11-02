// Supabase Edge Function: Server-Side Scheduled Renewal Reminders
// Can be triggered daily via pg_cron or Supabase Scheduled Functions.
// Sends emails via Resend or webhooks before renewals occur.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find subscriptions renewing in the next 3 days
    const today = new Date();
    const inThreeDays = new Date();
    inThreeDays.setDate(today.getDate() + 3);
    const targetDate = inThreeDays.toISOString().slice(0, 10);

    const { data: dueSubs, error } = await supabase
      .from("subscriptions")
      .select("*, auth.users(email)")
      .eq("renewal", targetDate)
      .eq("status", "active");

    if (error) throw error;

    console.log(`Found ${dueSubs?.length || 0} subscriptions due on ${targetDate}`);

    // If Resend API key is configured, send emails
    if (resendApiKey && dueSubs && dueSubs.length > 0) {
      for (const sub of dueSubs) {
        const userEmail = sub.users?.email;
        if (!userEmail) continue;

        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Nudge Alerts <alerts@nudge.app>",
            to: [userEmail],
            subject: `🔔 [Nudge] ${sub.name} renews in 3 days (${sub.currency} ${sub.amount})`,
            html: `<div style="font-family: sans-serif; padding: 20px;">
              <h2>Upcoming Renewal Notice</h2>
              <p>Your subscription to <strong>${sub.name}</strong> is scheduled to renew on <strong>${sub.renewal}</strong>.</p>
              <p>Amount: <strong>${sub.currency} ${sub.amount}</strong> (${sub.cycle})</p>
              <p>If you no longer use this service, remember to cancel before the debit occurs.</p>
            </div>`,
          }),
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: dueSubs?.length || 0,
        targetDate,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

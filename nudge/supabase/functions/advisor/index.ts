// Supabase Edge Function: Real LLM Subscription Advisor
// Deploy with: supabase functions deploy advisor --no-verify-jwt
// Set secrets: supabase secrets set ANTHROPIC_API_KEY="your-key" or GEMINI_API_KEY="your-key"

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { subscriptions, currencySymbol = "$" } = await req.json();

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY") || Deno.env.get("GEMINI_API_KEY");

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "API key not configured in Supabase secrets. Using client-side heuristic engine.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = `Analyze this subscription portfolio and provide 3 actionable money-saving opportunities:
Subscriptions:
${JSON.stringify(subscriptions, null, 2)}
Currency: ${currencySymbol}

Respond in concise JSON with: { "auditSummary": string, "highPriorityCuts": string[], "estimatedAnnualSavings": number }`;

    // Example Anthropic Claude call:
    if (Deno.env.get("ANTHROPIC_API_KEY")) {
      const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = await anthropicRes.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ status: "ok" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

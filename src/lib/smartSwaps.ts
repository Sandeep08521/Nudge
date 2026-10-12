import { annualCost, monthlyCost, type Subscription } from "./subscriptions";

export interface SmartSwapRecommendation {
  id: string;
  subscriptionId: number;
  subscriptionName: string;
  category: string;
  brand: string;
  title: string;
  badge: string;
  badgeColor: "emerald" | "amber" | "indigo" | "rose";
  description: string;
  currentCostPerYear: number;
  newCostPerYear: number;
  estimatedYearlySavings: number;
  actionUrl: string;
  actionLabel: string;
  steps: string[];
}

export function getSmartSwaps(
  subscriptions: Subscription[],
  currencySymbol: string = "$"
): SmartSwapRecommendation[] {
  const recommendations: SmartSwapRecommendation[] = [];

  subscriptions.forEach((sub) => {
    if (sub.status === "cancelled") return;
    const lowerName = sub.name.toLowerCase();
    const currentAnnual = annualCost(sub);
    const currentMonth = monthlyCost(sub);

    // 1. Netflix Swaps
    if (lowerName.includes("netflix") || sub.brand === "netflix") {
      if (currentMonth >= (currencySymbol === "₹" ? 400 : 15)) {
        const estSavings = Math.round(currentAnnual * 0.45);
        recommendations.push({
          id: `netflix-ad-${sub.id}`,
          subscriptionId: sub.id,
          subscriptionName: sub.name,
          category: sub.category,
          brand: "netflix",
          title: "Swap to Standard with Ads (Save ~45%)",
          badge: "Plan Downgrade",
          badgeColor: "emerald",
          description:
            "If you don't mind 2-3 minutes of commercials per hour, switching from Premium/Standard to the ad-supported tier cuts your bill in half with full 1080p video quality.",
          currentCostPerYear: currentAnnual,
          newCostPerYear: currentAnnual - estSavings,
          estimatedYearlySavings: estSavings,
          actionUrl: "https://www.netflix.com/youraccount",
          actionLabel: "Change Netflix Plan →",
          steps: [
            "Go to Netflix Account Settings > Plan Details.",
            "Select 'Change Plan'.",
            "Choose 'Standard with ads' and confirm.",
          ],
        });
      }
    }

    // 2. Spotify Swaps (Family / Duo split or Annual discount)
    if (lowerName.includes("spotify") || sub.brand === "spotify") {
      if (!sub.is_shared) {
        const estSavings = Math.round(currentAnnual * 0.5);
        recommendations.push({
          id: `spotify-duo-${sub.id}`,
          subscriptionId: sub.id,
          subscriptionName: sub.name,
          category: sub.category,
          brand: "spotify",
          title: "Split with Partner or Family (Duo / Family Plan)",
          badge: "Group Split",
          badgeColor: "indigo",
          description:
            "Spotify Duo is only ~25% more than Individual for 2 separate accounts, and Spotify Family gives 6 distinct accounts. Splitting brings your per-person cost down by up to 60%.",
          currentCostPerYear: currentAnnual,
          newCostPerYear: currentAnnual - estSavings,
          estimatedYearlySavings: estSavings,
          actionUrl: "https://www.spotify.com/account/overview/",
          actionLabel: "Manage Spotify Plan →",
          steps: [
            "Visit your Spotify Account Overview.",
            "Under 'Your plan', click 'Change plan'.",
            "Select 'Premium Duo' or 'Premium Family' and invite members.",
          ],
        });
      }
    }

    // 3. YouTube Premium Swaps
    if (lowerName.includes("youtube") || sub.brand === "youtube") {
      if (sub.cycle === "monthly") {
        const estSavings = Math.round(currentAnnual * 0.17);
        recommendations.push({
          id: `youtube-annual-${sub.id}`,
          subscriptionId: sub.id,
          subscriptionName: sub.name,
          category: sub.category,
          brand: "youtube",
          title: "Switch to YouTube Annual Prepaid Plan",
          badge: "Billing Optimization",
          badgeColor: "amber",
          description:
            "YouTube offers a hidden 12-month prepaid plan that saves approximately 15-20% compared to paying month-to-month.",
          currentCostPerYear: currentAnnual,
          newCostPerYear: currentAnnual - estSavings,
          estimatedYearlySavings: estSavings,
          actionUrl: "https://www.youtube.com/paid_memberships",
          actionLabel: "View Annual Options →",
          steps: [
            "Open YouTube Paid Memberships in a browser.",
            "Cancel your auto-renewing monthly membership when close to expiry.",
            "Purchase the 12-Month YouTube Premium Prepaid pass.",
          ],
        });
      }
    }

    // 4. ChatGPT Plus / OpenAI
    if (lowerName.includes("chatgpt") || lowerName.includes("openai") || sub.brand === "chatgpt") {
      const estSavings = Math.round(currentAnnual * 0.7);
      recommendations.push({
        id: `chatgpt-usage-${sub.id}`,
        subscriptionId: sub.id,
        subscriptionName: sub.name,
        category: sub.category,
        brand: "chatgpt",
        title: "Audit AI Usage vs Free 4o / Claude / API",
        badge: "AI Optimization",
        badgeColor: "rose",
        description:
          "The free tier of ChatGPT now provides GPT-4o, custom GPTs, and web browsing. If you don't use heavy deep reasoning daily, pausing Plus saves you over $240/yr.",
        currentCostPerYear: currentAnnual,
        newCostPerYear: currentAnnual - estSavings,
        estimatedYearlySavings: estSavings,
        actionUrl: "https://chatgpt.com/#settings/Subscription",
        actionLabel: "Manage ChatGPT Plan →",
        steps: [
          "Open ChatGPT Settings > Manage My Subscription.",
          "Click 'Cancel Subscription' (access remains until the end of your billing cycle).",
          "Test free tier GPT-4o for 2 weeks to verify if you really need Plus.",
        ],
      });
    }

    // 5. Amazon Prime
    if (lowerName.includes("prime") || sub.brand === "prime") {
      if (sub.cycle === "monthly") {
        const estSavings = Math.round(currentMonth * 12 - (currencySymbol === "₹" ? 1499 : 139));
        if (estSavings > 0) {
          recommendations.push({
            id: `prime-annual-${sub.id}`,
            subscriptionId: sub.id,
            subscriptionName: sub.name,
            category: sub.category,
            brand: "prime",
            title: "Switch Amazon Prime from Monthly to Annual",
            badge: "Annual Discount",
            badgeColor: "amber",
            description:
              "Paying Amazon Prime monthly ($14.99/mo or ₹299/mo) costs significantly more than the discounted 1-year upfront subscription.",
            currentCostPerYear: currentAnnual,
            newCostPerYear: currentAnnual - estSavings,
            estimatedYearlySavings: estSavings,
            actionUrl: "https://www.amazon.com/mc/manage",
            actionLabel: "Switch Prime Billing →",
            steps: [
              "Visit Amazon > Your Prime Membership.",
              "Click 'Manage Membership' > 'Change Billing Frequency'.",
              "Select Annual Plan.",
            ],
          });
        }
      }
    }

    // 6. Cloud Storage (iCloud / Google One)
    if (lowerName.includes("icloud") || lowerName.includes("google one") || sub.brand === "icloud") {
      if (currentMonth > (currencySymbol === "₹" ? 150 : 2.99)) {
        const estSavings = Math.round(currentAnnual * 0.5);
        recommendations.push({
          id: `storage-share-${sub.id}`,
          subscriptionId: sub.id,
          subscriptionName: sub.name,
          category: sub.category,
          brand: "icloud",
          title: "Share Cloud Storage via Family Sharing",
          badge: "Family Cloud Pool",
          badgeColor: "indigo",
          description:
            "Both Apple and Google allow you to share a single 200GB or 2TB cloud storage plan with up to 5 family members at no extra cost, keeping private files separate.",
          currentCostPerYear: currentAnnual,
          newCostPerYear: currentAnnual - estSavings,
          estimatedYearlySavings: estSavings,
          actionUrl: "https://support.apple.com/en-us/HT208147",
          actionLabel: "View Family Storage Setup →",
          steps: [
            "Enable Family Sharing on iOS or Google One.",
            "Share your storage plan with up to 5 family members.",
            "Cancel duplicate storage subscriptions on other family devices.",
          ],
        });
      }
    }

    // 7. General Monthly-to-Annual Discount for any service billed monthly with cost > threshold
    if (
      sub.cycle === "monthly" &&
      !recommendations.some((r) => r.subscriptionId === sub.id) &&
      currentMonth >= (currencySymbol === "₹" ? 300 : 8)
    ) {
      const estSavings = Math.round(currentAnnual * 0.18);
      recommendations.push({
        id: `generic-annual-${sub.id}`,
        subscriptionId: sub.id,
        subscriptionName: sub.name,
        category: sub.category,
        brand: sub.brand,
        title: `Ask for Annual Billing Discount on ${sub.name}`,
        badge: "Save ~18%",
        badgeColor: "emerald",
        description:
          `Most ${sub.category.toLowerCase()} services offer 15-20% discounts (equivalent to 2 months free) if you commit to annual billing instead of paying monthly.`,
        currentCostPerYear: currentAnnual,
        newCostPerYear: currentAnnual - estSavings,
        estimatedYearlySavings: estSavings,
        actionUrl: "#",
        actionLabel: "Check Plan Settings →",
        steps: [
          `Log in to your ${sub.name} account settings.`,
          "Navigate to Billing / Subscription tier.",
          "Check if Annual Billing offers a discount (usually 2 months free).",
        ],
      });
    }
  });

  return recommendations;
}

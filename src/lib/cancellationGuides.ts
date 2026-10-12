export type CancellationGuide = {
  id: string;
  name: string;
  category: string;
  directUrl?: string;
  steps: string[];
  tips?: string;
  refundPolicyNotes?: string;
};

export const CANCELLATION_GUIDES: Record<string, CancellationGuide> = {
  netflix: {
    id: "netflix",
    name: "Netflix",
    category: "Entertainment",
    directUrl: "https://www.netflix.com/youraccount",
    steps: [
      "Open netflix.com and log in with your primary profile.",
      "Click your profile icon (top right) and select 'Account'.",
      "Under the 'Membership & Billing' section, click 'Cancel Membership'.",
      "Click 'Finish Cancellation' to confirm.",
      "Tip: If you paid via UPI AutoPay, you can also revoke the mandate directly in PhonePe/Google Pay.",
    ],
    tips: "Your account stays active until the end of your current billing period. Netflix saves your viewing history for 10 months if you rejoin.",
    refundPolicyNotes: "Netflix generally does not provide partial refunds for mid-cycle cancellations.",
  },
  hotstar: {
    id: "hotstar",
    name: "Disney+ Hotstar / JioHotstar",
    category: "Entertainment",
    directUrl: "https://www.hotstar.com/in/my-account",
    steps: [
      "Open Hotstar app or visit hotstar.com and log in with your phone number.",
      "Navigate to 'My Space' or click your profile avatar.",
      "Click 'Help & Settings' → 'Subscriptions & Devices'.",
      "Select your active plan and click 'Cancel Subscription'.",
      "Important: If subscribed via Google Play Store or Apple ID, cancel directly via Play Store or iOS Settings.",
    ],
    tips: "For subscriptions activated via telecom bundles (Jio, Airtel), cancellation is managed through the telecom app (MyJio / Airtel Thanks).",
    refundPolicyNotes: "Non-refundable once debited. Plan benefits run until the end of the paid term.",
  },
  spotify: {
    id: "spotify",
    name: "Spotify Premium",
    category: "Music",
    directUrl: "https://www.spotify.com/account/overview/",
    steps: [
      "Log into spotify.com/account in any web browser (cannot cancel inside the mobile app).",
      "Under 'Your plan', click 'Change plan'.",
      "Scroll down to 'Spotify Free' and click 'Cancel Premium'.",
      "Continue through the confirmation screens until you see the cancellation receipt.",
      "If you set up UPI AutoPay via PhonePe or GPay, delete the recurring mandate in the UPI app.",
    ],
    tips: "You will retain Premium features until your next scheduled billing date, then revert to Spotify Free with playlists intact.",
    refundPolicyNotes: "14-day cooling off period may be available through Spotify Customer Support if you have not used the service.",
  },
  prime: {
    id: "prime",
    name: "Amazon Prime",
    category: "Entertainment & Shopping",
    directUrl: "https://www.amazon.com/mc/pipelines/cancellation",
    steps: [
      "Open amazon.com (or your regional Amazon portal) and sign into your account.",
      "Hover over 'Account & Lists' and click 'Your Prime Membership'.",
      "Click 'Manage Membership' (top right of the Prime card).",
      "Click 'End Membership and Benefits' → 'Continue to Cancel'.",
      "Confirm by clicking 'Cancel Membership'.",
    ],
    tips: "Amazon frequently offers a prorated refund if you have not used any Prime benefits (free shipping, Prime Video) since the latest renewal!",
    refundPolicyNotes: "If an auto-renewal charged you unexpectedly and you immediately cancel without streaming or ordering, Amazon customer care usually issues a full refund.",
  },
  youtube: {
    id: "youtube",
    name: "YouTube Premium",
    category: "Entertainment",
    directUrl: "https://www.youtube.com/paid_memberships",
    steps: [
      "Visit youtube.com/paid_memberships or open YouTube app.",
      "Tap your profile picture → 'Purchases and memberships'.",
      "Tap 'YouTube Premium' under Memberships.",
      "Tap 'Deactivate' → Choose 'Continue to cancel' (or 'Pause' if you just need a break).",
      "Select your cancellation reason and confirm.",
    ],
    tips: "If you subscribed via Apple In-App Purchases (on iPhone), cancel through Apple ID Subscriptions in iOS Settings to avoid being billed at the higher Apple markup.",
    refundPolicyNotes: "Contact YouTube support for refund requests within 48 hours of accidental renewal.",
  },
  swiggy: {
    id: "swiggy",
    name: "Swiggy One / One Lite",
    category: "Food & Delivery",
    steps: [
      "Open the Swiggy mobile app.",
      "Tap your Profile icon (top right) → 'Swiggy One Membership'.",
      "Scroll to membership details and tap 'Manage Membership'.",
      "Tap 'Cancel Auto-Renewal' or turn off Auto-Debit.",
      "Recommended: Open PhonePe / Google Pay / Paytm, go to AutoPay settings, and remove the Swiggy mandate directly.",
    ],
    tips: "Revoking the UPI AutoPay mandate in your UPI app is 100% fail-safe and prevents Swiggy from charging your account again.",
    refundPolicyNotes: "Swiggy One membership fees are non-refundable once activated.",
  },
  zomato: {
    id: "zomato",
    name: "Zomato Gold",
    category: "Food & Delivery",
    steps: [
      "Open Zomato app → tap your Profile picture (top right).",
      "Tap 'Zomato Gold' banner → 'Manage Membership'.",
      "Select 'Turn off Auto-Renew' or cancel upcoming billing.",
      "Check your UPI app (PhonePe/GPay/Cred) under AutoPay and cancel any active Zomato mandate.",
    ],
    tips: "Zomato Gold benefits will continue until the expiration date of your current quarter.",
    refundPolicyNotes: "No refunds once renewed.",
  },
  cultfit: {
    id: "cultfit",
    name: "Cult.fit / Cultpass",
    category: "Wellness",
    steps: [
      "Open Cult.fit app → tap Profile (bottom right).",
      "Go to 'Active Packs / Subscriptions'.",
      "Tap on your Cultpass → 'Manage Pack' or 'Auto-Debit Settings'.",
      "Toggle off Auto-Debit / Cancel recurrence.",
      "Alternatively, freeze your membership if you are traveling (Cult allows up to 30-90 days freeze depending on plan).",
    ],
    tips: "Gym recurring mandates on credit cards can also be cancelled by logging into your bank's NetBanking portal.",
  },
  apple: {
    id: "apple",
    name: "Apple Subscriptions (iCloud, Apple One)",
    category: "Ecosystem",
    directUrl: "https://support.apple.com/billing",
    steps: [
      "On your iPhone/iPad, open the 'Settings' app.",
      "Tap your Name / Apple ID avatar at the very top.",
      "Tap 'Subscriptions'.",
      "Tap the active subscription you wish to stop.",
      "Tap 'Cancel Subscription' (or 'Cancel Free Trial') and confirm.",
    ],
    tips: "Apple provides access until the current period expires. Free trials should be cancelled at least 24 hours before expiration.",
    refundPolicyNotes: "Request refunds at reportaproblem.apple.com within 14 days.",
  },
  google: {
    id: "google",
    name: "Google Play Store / Google One",
    category: "Storage & Ecosystem",
    directUrl: "https://play.google.com/store/account/subscriptions",
    steps: [
      "Open Google Play Store on Android or visit play.google.com.",
      "Tap your profile icon (top right) → 'Payments & subscriptions' → 'Subscriptions'.",
      "Select the subscription you want to cancel.",
      "Tap 'Cancel subscription' at the bottom.",
      "Follow the instructions to finalize.",
    ],
    tips: "Google will keep your subscription active through the remaining days of your billing cycle.",
  },
};

export const UPI_AUTOPAY_GUIDE = {
  title: "Universal Cancellation via Payment Providers & Mandates",
  description:
    "You have the right to revoke recurring payment authorizations directly through your payment platform or bank. Once revoked, the merchant cannot charge your account.",
  apps: [
    {
      app: "Apple Subscriptions (iOS)",
      icon: "🍏",
      steps: [
        "Open Settings on your iPhone or iPad.",
        "Tap your Name / Apple ID at the very top.",
        "Tap 'Subscriptions'.",
        "Select the active subscription you want to cancel.",
        "Tap 'Cancel Subscription' (or 'Cancel Free Trial') and confirm.",
      ],
    },
    {
      app: "Google Play Store (Android)",
      icon: "▶️",
      steps: [
        "Open the Google Play Store app on your Android device.",
        "Tap your Profile Icon (top right).",
        "Tap 'Payments & subscriptions' → 'Subscriptions'.",
        "Select the subscription you wish to terminate.",
        "Tap 'Cancel subscription' at the bottom and follow the prompt.",
      ],
    },
    {
      app: "PayPal Automatic Payments",
      icon: "🅿️",
      steps: [
        "Log into paypal.com in your web browser.",
        "Click Settings (gear icon top right) → 'Payments'.",
        "Click 'Manage Automatic Payments'.",
        "Select the merchant from the left sidebar.",
        "Click 'Cancel' next to Status: Active, and confirm cancellation.",
      ],
    },
    {
      app: "Credit / Debit Card Recurring Mandates",
      icon: "💳",
      steps: [
        "Log into your mobile banking app or card issuer portal.",
        "Navigate to 'Cards' → 'Subscriptions & Recurring Payments' (or 'Standing Instructions').",
        "Locate the merchant in your active mandate list.",
        "Tap 'Block Recurring Payments' or 'Revoke Mandate'.",
        "Your bank will decline all future automatic billing attempts from that merchant.",
      ],
    },
    {
      app: "UPI AutoPay (PhonePe, GPay, Paytm)",
      icon: "⚡",
      steps: [
        "Open your UPI app (PhonePe: Profile → AutoPay Settings | Google Pay: Profile → Autopay | Paytm: AutoPay).",
        "Select the merchant mandate you wish to terminate.",
        "Tap 'Remove AutoPay' or 'Cancel Mandate'.",
        "Enter your UPI PIN to authenticate. The mandate is permanently revoked.",
      ],
    },
  ],
};

export function getGuideForMerchant(name: string): CancellationGuide {
  const lower = name.toLowerCase();
  for (const [key, guide] of Object.entries(CANCELLATION_GUIDES)) {
    if (lower.includes(key)) return guide;
  }

  return {
    id: "generic",
    name,
    category: "General",
    steps: [
      `1. Log into your account on ${name}'s official website or mobile app.`,
      "2. Look for 'Account', 'Settings', 'Billing', or 'Memberships' in the user menu.",
      "3. Locate your active subscription and click 'Cancel Subscription' or 'Turn off Auto-Renew'.",
      "4. If billed through Apple App Store or Google Play, cancel directly via your device subscription settings.",
      "5. If billed through PayPal, cancel the recurring billing agreement in your PayPal settings.",
      "6. If the company hides the cancel button, generate our draft cancellation email and send it to their support.",
    ],
    tips: "Remember: You have the right to revoke recurring authorizations directly with your card issuer or payment processor if a service makes cancellation difficult.",
  };
}

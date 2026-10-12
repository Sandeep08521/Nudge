import { type Subscription } from "./subscriptions";

function formatICSDate(dateStr: string): string {
  // dateStr is YYYY-MM-DD
  const cleaned = dateStr.replace(/[^0-9]/g, "");
  return `${cleaned}T090000Z`;
}

export function generateICS(subscriptions: Subscription[]): string {
  const now = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const events = subscriptions
    .filter((s) => s.status !== "cancelled" && s.renewal)
    .map((s) => {
      const sym = s.currency || "$";
      const startDate = formatICSDate(s.renewal);
      const isTrial = s.status === "trial";
      const summary = isTrial
        ? `⚠️ [Nudge] Free Trial Ends: ${s.name} (Auto-renews to ${sym}${s.amount})`
        : `🔔 [Nudge] Subscription Renewal: ${s.name} (${sym}${s.amount}/${s.cycle})`;

      const description = [
        `Service: ${s.name}`,
        `Amount: ${sym}${s.amount} (${s.cycle})`,
        `Payment Method: ${s.payment_method || "Payment Platform / Card"}`,
        `Type: ${isTrial ? "Free Trial Conversion" : "Recurring Renewal"}`,
        "",
        "Reminder Notice: Review this subscription before the renewal cutoff to avoid unwanted recurring debits.",
        "Tracked with Nudge - The Subscription Awareness Assistant",
      ].join("\\n");

      return [
        "BEGIN:VEVENT",
        `UID:nudge-${s.id}-${startDate}@nudge.local`,
        `DTSTAMP:${now}`,
        `DTSTART:${startDate}`,
        `DTEND:${startDate}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${description}`,
        // Alarm 3 days prior
        "BEGIN:VALARM",
        "TRIGGER:-P3D",
        "ACTION:DISPLAY",
        `DESCRIPTION:Reminder: ${s.name} renews in 3 days (${sym}${s.amount}).`,
        "END:VALARM",
        // Alarm 1 day prior
        "BEGIN:VALARM",
        "TRIGGER:-P1D",
        "ACTION:DISPLAY",
        `DESCRIPTION:URGENT: ${s.name} renews tomorrow! Cancel now if you do not want to be charged ${sym}${s.amount}.`,
        "END:VALARM",
        "END:VEVENT",
      ].join("\r\n");
    });

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Nudge//Subscription Tracker//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadCalendarFile(subscriptions: Subscription[], filename = "nudge-renewals.ics"): void {
  const icsData = generateICS(subscriptions);
  const blob = new Blob([icsData], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

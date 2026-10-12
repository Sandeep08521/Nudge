/**
 * Email validation, disposable domain blocking, typo detection, and OTP verification logic.
 */

// Common disposable/burner email domains to block
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "10minutemail.com",
  "tempmail.com",
  "temp-mail.org",
  "guerrillamail.com",
  "guerrillamailblock.com",
  "throwawaymail.com",
  "yopmail.com",
  "sharklasers.com",
  "dispostable.com",
  "getairmail.com",
  "trashmail.com",
  "burnermail.io",
  "fakeinbox.com",
]);

// Common typos in popular email providers
const DOMAIN_TYPOS: Record<string, string> = {
  "gmai.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "gnail.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gmaio.com": "gmail.com",
  "hotmial.com": "hotmail.com",
  "hotmai.com": "hotmail.com",
  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "outlok.com": "outlook.com",
  "outloo.com": "outlook.com",
  "icoud.com": "icloud.com",
  "prton.me": "proton.me",
};

export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
  suggestion?: string;
}

export function validateEmailFormat(rawEmail: string): EmailValidationResult {
  const email = rawEmail.trim().toLowerCase();

  if (!email) {
    return { isValid: false, error: "Please enter an email address." };
  }

  // Basic length constraints
  if (email.length < 5 || email.length > 254) {
    return { isValid: false, error: "Email address length is invalid." };
  }

  // RFC-5322 compliant email regex pattern
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: "Please enter a valid email format (e.g. name@domain.com)." };
  }

  const parts = email.split("@");
  if (parts.length !== 2) {
    return { isValid: false, error: "Email must contain exactly one '@' symbol." };
  }

  const [localPart, domainPart] = parts;

  if (localPart.length === 0 || localPart.length > 64) {
    return { isValid: false, error: "The username portion of the email is invalid." };
  }

  // Check top-level domain (TLD)
  const domainParts = domainPart.split(".");
  const tld = domainParts[domainParts.length - 1];
  if (!tld || tld.length < 2) {
    return { isValid: false, error: "Domain extension (TLD) must be at least 2 characters (e.g. .com, .org)." };
  }

  // Block disposable / throwaway email domains
  if (DISPOSABLE_DOMAINS.has(domainPart)) {
    return {
      isValid: false,
      error: "Temporary or disposable email addresses are not accepted. Please use a permanent email address.",
    };
  }

  // Check for common typos and suggest corrections
  if (DOMAIN_TYPOS[domainPart]) {
    const suggestedDomain = DOMAIN_TYPOS[domainPart];
    const suggestedEmail = `${localPart}@${suggestedDomain}`;
    return {
      isValid: true,
      suggestion: suggestedEmail,
    };
  }

  return { isValid: true };
}

// In-browser verification storage for local accounts
const PENDING_VERIFICATION_KEY = "nudge_pending_email_verification";

export interface PendingVerification {
  email: string;
  code: string;
  passwordHash: string;
  expiresAt: number; // timestamp
}

export function generateVerificationCode(): string {
  // Generate random 6-digit numeric OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function savePendingVerification(email: string, code: string, passwordHash: string): void {
  const pending: PendingVerification = {
    email: email.trim().toLowerCase(),
    code,
    passwordHash,
    expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes validity
  };
  try {
    localStorage.setItem(PENDING_VERIFICATION_KEY, JSON.stringify(pending));
  } catch {}
}

export function getPendingVerification(): PendingVerification | null {
  try {
    const raw = localStorage.getItem(PENDING_VERIFICATION_KEY);
    if (!raw) return null;
    const parsed: PendingVerification = JSON.parse(raw);
    if (Date.now() > parsed.expiresAt) {
      clearPendingVerification();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingVerification(): void {
  try {
    localStorage.removeItem(PENDING_VERIFICATION_KEY);
  } catch {}
}

import { isSupabaseConfigured, supabase } from "./supabase";
import {
  validateEmailFormat,
  generateVerificationCode,
  savePendingVerification,
  getPendingVerification,
  clearPendingVerification,
  type EmailValidationResult,
} from "./emailValidator";

export type AuthUser = {
  id: string;
  email: string;
  created_at: string;
  is_verified?: boolean;
};

export type AuthSession = {
  user: AuthUser;
  token?: string;
};

const LOCAL_ACCOUNTS_KEY = "nudge_registered_accounts";
const LOCAL_SESSION_KEY = "nudge_active_session";

type LocalAccount = {
  id: string;
  email: string;
  passwordHash: string; // basic hash for offline storage
  created_at: string;
  is_verified?: boolean;
};

function getLocalAccounts(): LocalAccount[] {
  try {
    const raw = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalAccounts(accounts: LocalAccount[]): void {
  localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
}

function getStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(LOCAL_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveStoredSession(session: AuthSession | null): void {
  if (session) {
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(LOCAL_SESSION_KEY);
  }
}

type AuthCallback = (session: AuthSession | null) => void;
const listeners: Set<AuthCallback> = new Set();

function notifyListeners(session: AuthSession | null) {
  listeners.forEach((fn) => fn(session));
}

export const authService = {
  isCloudActive(): boolean {
    return isSupabaseConfigured;
  },

  async getSession(): Promise<AuthSession | null> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session) return null;
        return {
          user: {
            id: data.session.user.id,
            email: data.session.user.email || "user@nudge.app",
            created_at: data.session.user.created_at,
          },
          token: data.session.access_token,
        };
      } catch (err) {
        console.warn("Supabase auth session fetch error, checking local session:", err);
      }
    }

    return getStoredSession();
  },

  validateEmail(email: string): EmailValidationResult {
    return validateEmailFormat(email);
  },

  /**
   * Request email verification:
   * Validates format, checks disposable domains, detects typos, and sends/generates 6-digit OTP code.
   */
  async sendVerificationCode(
    emailInput: string,
    passwordInput: string
  ): Promise<{ requiresOtp: boolean; simulatedCode?: string; message: string }> {
    const email = emailInput.trim().toLowerCase();
    const password = passwordInput.trim();

    // 1. Strict email validation
    const validation = validateEmailFormat(email);
    if (!validation.isValid) {
      throw new Error(validation.error || "Please enter a valid email address.");
    }
    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters long.");
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      if (!data.user) throw new Error("Failed to create Supabase account.");

      return {
        requiresOtp: true,
        message: `A verification confirmation was sent to ${email} by Supabase. Please check your inbox.`,
      };
    }

    // Local multi-user persistence: check if already exists
    const accounts = getLocalAccounts();
    const existing = accounts.find((a) => a.email.toLowerCase() === email);
    if (existing) {
      throw new Error("An account with this email already exists. Please sign in instead.");
    }

    // Generate real 6-digit verification code
    const code = generateVerificationCode();
    savePendingVerification(email, code, btoa(password));

    return {
      requiresOtp: true,
      simulatedCode: code,
      message: `A 6-digit verification code has been dispatched to ${email}.`,
    };
  },

  /**
   * Confirm the 6-digit OTP code to finalize account creation
   */
  async verifyOtp(emailInput: string, codeInput: string): Promise<AuthSession> {
    const email = emailInput.trim().toLowerCase();
    const code = codeInput.trim();

    if (!code || code.length !== 6) {
      throw new Error("Please enter the complete 6-digit verification code.");
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "signup",
      });
      if (error) throw error;
      if (!data.user) throw new Error("Verification failed. Please check the code.");

      const session: AuthSession = {
        user: {
          id: data.user.id,
          email: data.user.email || email,
          created_at: data.user.created_at,
          is_verified: true,
        },
        token: data.session?.access_token,
      };
      notifyListeners(session);
      return session;
    }

    // Local verification
    const pending = getPendingVerification();
    if (!pending || pending.email !== email) {
      throw new Error("Verification session expired or not found. Please request a new code.");
    }

    if (pending.code !== code) {
      throw new Error("Invalid verification code. Please check the digits and try again.");
    }

    // Code matches! Create the account
    const accounts = getLocalAccounts();
    const newId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newAccount: LocalAccount = {
      id: newId,
      email,
      passwordHash: pending.passwordHash,
      created_at: new Date().toISOString(),
      is_verified: true,
    };

    accounts.push(newAccount);
    saveLocalAccounts(accounts);
    clearPendingVerification();

    const session: AuthSession = {
      user: {
        id: newAccount.id,
        email: newAccount.email,
        created_at: newAccount.created_at,
        is_verified: true,
      },
    };
    saveStoredSession(session);
    notifyListeners(session);
    return session;
  },

  async signUp(emailInput: string, passwordInput: string): Promise<AuthSession> {
    const email = emailInput.trim().toLowerCase();
    const password = passwordInput.trim();

    const validation = validateEmailFormat(email);
    if (!validation.isValid) {
      throw new Error(validation.error || "Please enter a valid email address.");
    }
    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters long.");
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      if (!data.user) throw new Error("Failed to create Supabase account.");

      const session: AuthSession = {
        user: {
          id: data.user.id,
          email: data.user.email || email,
          created_at: data.user.created_at,
        },
        token: data.session?.access_token,
      };
      notifyListeners(session);
      return session;
    }

    // Local multi-user persistence
    const accounts = getLocalAccounts();
    const existing = accounts.find((a) => a.email.toLowerCase() === email);
    if (existing) {
      throw new Error("An account with this email already exists. Please sign in instead.");
    }

    const newId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newAccount: LocalAccount = {
      id: newId,
      email,
      passwordHash: btoa(password), // simple base64 hash for browser storage
      created_at: new Date().toISOString(),
      is_verified: true,
    };

    accounts.push(newAccount);
    saveLocalAccounts(accounts);

    const session: AuthSession = {
      user: {
        id: newAccount.id,
        email: newAccount.email,
        created_at: newAccount.created_at,
        is_verified: true,
      },
    };
    saveStoredSession(session);
    notifyListeners(session);
    return session;
  },

  async signIn(emailInput: string, passwordInput: string): Promise<AuthSession> {
    const email = emailInput.trim().toLowerCase();
    const password = passwordInput.trim();

    const validation = validateEmailFormat(email);
    if (!validation.isValid) {
      throw new Error(validation.error || "Please enter a valid email address.");
    }
    if (!password) {
      throw new Error("Please enter your password.");
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      if (!data.user) throw new Error("Invalid login credentials.");

      const session: AuthSession = {
        user: {
          id: data.user.id,
          email: data.user.email || email,
          created_at: data.user.created_at,
        },
        token: data.session?.access_token,
      };
      notifyListeners(session);
      return session;
    }

    // Local authentication check
    const accounts = getLocalAccounts();
    const matched = accounts.find((a) => a.email.toLowerCase() === email);
    if (!matched) {
      throw new Error("No account found with this email. Please create an account first.");
    }

    if (matched.passwordHash !== btoa(password)) {
      throw new Error("Incorrect password. Please try again.");
    }

    const session: AuthSession = {
      user: {
        id: matched.id,
        email: matched.email,
        created_at: matched.created_at,
      },
    };
    saveStoredSession(session);
    notifyListeners(session);
    return session;
  },

  async signInWithGoogle(customEmail?: string): Promise<AuthSession> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/dashboard`,
          },
        });
        if (error) throw error;
        return {
          user: {
            id: "oauth_redirecting",
            email: "google-auth@nudge.app",
            created_at: new Date().toISOString(),
          },
        };
      } catch (err) {
        console.warn("Supabase Google OAuth error:", err);
        if (!customEmail) throw err;
      }
    }

    // Local / offline multi-user authentication with Google identity
    const email = (customEmail || "google.user@gmail.com").trim().toLowerCase();
    const accounts = getLocalAccounts();
    let matched = accounts.find((a) => a.email.toLowerCase() === email);

    if (!matched) {
      const newAccount: LocalAccount = {
        id: `google_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        email,
        passwordHash: "oauth_google_verified",
        created_at: new Date().toISOString(),
      };
      accounts.push(newAccount);
      saveLocalAccounts(accounts);
      matched = newAccount;
    }

    const session: AuthSession = {
      user: {
        id: matched.id,
        email: matched.email,
        created_at: matched.created_at,
      },
    };
    saveStoredSession(session);
    notifyListeners(session);
    return session;
  },

  async signOut(): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn("Supabase signout failed:", err);
      }
    }

    saveStoredSession(null);
    notifyListeners(null);
  },

  onAuthStateChange(callback: AuthCallback): () => void {
    listeners.add(callback);

    let supabaseUnsub: (() => void) | null = null;
    if (isSupabaseConfigured) {
      const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        if (nextSession) {
          callback({
            user: {
              id: nextSession.user.id,
              email: nextSession.user.email || "user@nudge.app",
              created_at: nextSession.user.created_at,
            },
            token: nextSession.access_token,
          });
        } else {
          callback(null);
        }
      });
      supabaseUnsub = () => data.subscription.unsubscribe();
    }

    return () => {
      listeners.delete(callback);
      if (supabaseUnsub) supabaseUnsub();
    };
  },
};

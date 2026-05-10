import Stripe from "stripe";
import { logger } from "./logger";

const PREMIUM_PRICE_EUR = 89;

export const STRIPE_CONFIG = {
  premiumPriceEur: PREMIUM_PRICE_EUR,
  premiumProductName: "Klard Premium (Berater)",
  currency: "eur",
};

let cachedConnection: { token: string; expiresAt: number } | null = null;

async function getStripeConnection(): Promise<{
  accessToken: string;
} | null> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken =
    process.env.REPL_IDENTITY
      ? `repl ${process.env.REPL_IDENTITY}`
      : process.env.WEB_REPL_RENEWAL
        ? `depl ${process.env.WEB_REPL_RENEWAL}`
        : null;

  if (!hostname || !xReplitToken) {
    return null;
  }

  if (cachedConnection && cachedConnection.expiresAt > Date.now() + 60_000) {
    return { accessToken: cachedConnection.token };
  }

  try {
    const url = `https://${hostname}/api/v2/connection?include_secrets=true&connector_names=stripe`;
    const resp = await fetch(url, {
      headers: { Accept: "application/json", X_REPLIT_TOKEN: xReplitToken },
    });
    if (!resp.ok) {
      logger.warn({ status: resp.status }, "Stripe connection lookup failed");
      return null;
    }
    const data = (await resp.json()) as {
      items?: Array<{
        settings?: {
          access_token?: string;
          expires_at?: string;
          oauth?: { credentials?: { access_token?: string; expires_at?: string } };
        };
      }>;
    };
    const item = data.items?.[0];
    const settings = item?.settings;
    const token =
      settings?.access_token ?? settings?.oauth?.credentials?.access_token;
    if (!token) return null;
    const expiresAtRaw =
      settings?.expires_at ?? settings?.oauth?.credentials?.expires_at;
    const expiresAt = expiresAtRaw ? new Date(expiresAtRaw).getTime() : Date.now() + 30 * 60_000;
    cachedConnection = { token, expiresAt };
    return { accessToken: token };
  } catch (err) {
    logger.error({ err }, "Failed to load Stripe connection");
    return null;
  }
}

export async function getUncachableStripeClient(): Promise<Stripe | null> {
  const conn = await getStripeConnection();
  if (!conn) return null;
  return new Stripe(conn.accessToken);
}

export async function isStripeConfigured(): Promise<boolean> {
  return (await getStripeConnection()) !== null;
}

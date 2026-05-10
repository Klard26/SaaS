// Stripe integration via Replit-managed connector.
// See blueprint snippet `snippets/stripe-replit-sync..js` for the canonical
// connection lookup pattern.
import Stripe from "stripe";
import { logger } from "./logger";

const PREMIUM_PRICE_EUR = 89;

export const STRIPE_CONFIG = {
  premiumPriceEur: PREMIUM_PRICE_EUR,
  premiumProductName: "Klard Premium (Berater)",
  currency: "eur",
};

async function getCredentials(): Promise<{ secretKey: string; publishableKey: string } | null> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? `repl ${process.env.REPL_IDENTITY}`
    : process.env.WEB_REPL_RENEWAL
      ? `depl ${process.env.WEB_REPL_RENEWAL}`
      : null;

  if (!hostname || !xReplitToken) return null;

  const isProduction = process.env.REPLIT_DEPLOYMENT === "1";
  const targetEnvironment = isProduction ? "production" : "development";

  const url = new URL(`https://${hostname}/api/v2/connection`);
  url.searchParams.set("include_secrets", "true");
  url.searchParams.set("connector_names", "stripe");
  url.searchParams.set("environment", targetEnvironment);

  try {
    const resp = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "X-Replit-Token": xReplitToken,
      },
    });
    if (!resp.ok) {
      logger.warn({ status: resp.status }, "Stripe connection lookup failed");
      return null;
    }
    const data = (await resp.json()) as {
      items?: Array<{
        settings?: { publishable?: string; secret?: string };
      }>;
    };
    const settings = data.items?.[0]?.settings;
    if (!settings?.publishable || !settings?.secret) return null;
    return { publishableKey: settings.publishable, secretKey: settings.secret };
  } catch (err) {
    logger.error({ err }, "Failed to load Stripe credentials");
    return null;
  }
}

export async function getUncachableStripeClient(): Promise<Stripe | null> {
  const creds = await getCredentials();
  if (!creds) return null;
  return new Stripe(creds.secretKey, { apiVersion: "2026-04-22.dahlia" });
}

export async function isStripeConfigured(): Promise<boolean> {
  return (await getCredentials()) !== null;
}

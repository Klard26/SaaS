// Replit Resend integration — see ./snippets/resend.js (blueprint:resend)
// Token/client must NOT be cached: tokens expire, always fetch fresh.
import { Resend } from "resend";

interface ResendCredentials {
  apiKey: string;
  fromEmail: string | null;
}

async function getCredentials(): Promise<ResendCredentials | null> {
  const hostname = process.env["REPLIT_CONNECTORS_HOSTNAME"];
  const xReplitToken = process.env["REPL_IDENTITY"]
    ? "repl " + process.env["REPL_IDENTITY"]
    : process.env["WEB_REPL_RENEWAL"]
      ? "depl " + process.env["WEB_REPL_RENEWAL"]
      : null;

  if (!hostname || !xReplitToken) return null;

  const resp = await fetch(
    `https://${hostname}/api/v2/connection?include_secrets=true&connector_names=resend`,
    {
      headers: {
        Accept: "application/json",
        "X-Replit-Token": xReplitToken,
      },
    },
  );
  if (!resp.ok) return null;
  const data = (await resp.json()) as {
    items?: Array<{ settings?: { api_key?: string; from_email?: string } }>;
  };
  const item = data.items?.[0];
  if (!item?.settings?.api_key) return null;
  return {
    apiKey: item.settings.api_key,
    fromEmail: item.settings.from_email ?? null,
  };
}

export interface ResendClient {
  client: Resend;
  fromEmail: string;
}

export async function getUncachableResendClient(): Promise<ResendClient | null> {
  const creds = await getCredentials();
  if (!creds) return null;
  // Default to Resend's onboarding sender until the user verifies their own domain.
  const fromEmail =
    creds.fromEmail ??
    process.env["RESEND_FROM_EMAIL"] ??
    "Klard <onboarding@resend.dev>";
  return { client: new Resend(creds.apiKey), fromEmail };
}

export async function isResendConfigured(): Promise<boolean> {
  return (await getCredentials()) !== null;
}

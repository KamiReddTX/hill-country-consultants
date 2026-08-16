import crypto from "crypto";

// DocuSign eSignature (JWT Grant). Server-only. Sandbox defaults; override via env.
//   DOCUSIGN_INTEGRATION_KEY  – integration key (client id) → JWT "iss"
//   DOCUSIGN_USER_ID          – API user GUID              → JWT "sub"
//   DOCUSIGN_ACCOUNT_ID       – DocuSign account id (GUID)
//   DOCUSIGN_PRIVATE_KEY      – RSA private key (PEM)
//   DOCUSIGN_OAUTH_BASE       – account-d.docusign.com (sandbox) | account.docusign.com (prod)
//   DOCUSIGN_BASE_PATH        – https://demo.docusign.net/restapi (sandbox) | https://<region>.docusign.net/restapi

const OAUTH = process.env.DOCUSIGN_OAUTH_BASE || "account-d.docusign.com";
const BASE = process.env.DOCUSIGN_BASE_PATH || "https://demo.docusign.net/restapi";
const ACCOUNT = process.env.DOCUSIGN_ACCOUNT_ID || "";

const b64url = (b: Buffer | string) => Buffer.from(b).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

export function docusignConfigured(): boolean {
  return !!(process.env.DOCUSIGN_INTEGRATION_KEY && process.env.DOCUSIGN_USER_ID && process.env.DOCUSIGN_PRIVATE_KEY && ACCOUNT);
}

/** Exchange a JWT assertion for an access token (impersonating the API user). */
async function accessToken(): Promise<string> {
  const iss = process.env.DOCUSIGN_INTEGRATION_KEY!;
  const sub = process.env.DOCUSIGN_USER_ID!;
  const key = String(process.env.DOCUSIGN_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  const iat = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = b64url(JSON.stringify({ iss, sub, aud: OAUTH, iat, exp: iat + 3600, scope: "signature impersonation" }));
  const sig = b64url(crypto.createSign("RSA-SHA256").update(`${header}.${payload}`).sign(key));
  const assertion = `${header}.${payload}.${sig}`;
  const r = await fetch(`https://${OAUTH}/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${assertion}`,
  });
  const j = await r.json();
  if (!j.access_token) throw new Error(`DocuSign auth failed: ${JSON.stringify(j)}`);
  return j.access_token as string;
}

/** Create an envelope from a PDF and return its id. Signer signs embedded. */
export async function createEnvelope(opts: {
  pdfBase64: string; docName: string; signerEmail: string; signerName: string; clientUserId: string;
}): Promise<string> {
  const token = await accessToken();
  const body = {
    emailSubject: `Please sign: ${opts.docName}`,
    documents: [{ documentBase64: opts.pdfBase64, name: opts.docName, fileExtension: "pdf", documentId: "1" }],
    recipients: {
      signers: [{
        email: opts.signerEmail, name: opts.signerName, recipientId: "1", clientUserId: opts.clientUserId,
        tabs: { signHereTabs: [{ documentId: "1", pageNumber: "1", xPosition: "100", yPosition: "650" }] },
      }],
    },
    status: "sent",
  };
  const r = await fetch(`${BASE}/v2.1/accounts/${ACCOUNT}/envelopes`, {
    method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify(body),
  });
  const j = await r.json();
  if (!j.envelopeId) throw new Error(`DocuSign envelope failed: ${JSON.stringify(j)}`);
  return j.envelopeId as string;
}

/** Get an embedded signing URL for the recipient. */
export async function recipientViewUrl(opts: {
  envelopeId: string; signerEmail: string; signerName: string; clientUserId: string; returnUrl: string;
}): Promise<string> {
  const token = await accessToken();
  const r = await fetch(`${BASE}/v2.1/accounts/${ACCOUNT}/envelopes/${opts.envelopeId}/views/recipient`, {
    method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ returnUrl: opts.returnUrl, authenticationMethod: "none", email: opts.signerEmail, userName: opts.signerName, clientUserId: opts.clientUserId, recipientId: "1" }),
  });
  const j = await r.json();
  if (!j.url) throw new Error(`DocuSign recipient view failed: ${JSON.stringify(j)}`);
  return j.url as string;
}

/** Download the completed (signed) combined PDF for an envelope. */
export async function combinedPdf(envelopeId: string): Promise<Buffer> {
  const token = await accessToken();
  const r = await fetch(`${BASE}/v2.1/accounts/${ACCOUNT}/envelopes/${envelopeId}/documents/combined`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error(`DocuSign download failed: ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}

/** Envelope status ('sent' | 'completed' | ...). */
export async function envelopeStatus(envelopeId: string): Promise<string> {
  const token = await accessToken();
  const r = await fetch(`${BASE}/v2.1/accounts/${ACCOUNT}/envelopes/${envelopeId}`, { headers: { authorization: `Bearer ${token}` } });
  const j = await r.json();
  return j.status || "unknown";
}

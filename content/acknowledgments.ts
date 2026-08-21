/** The IT, Security & Confidentiality Acknowledgment every employee signs on
 *  their profile. Bump ACK_VERSION when the terms change to require re-signing. */

export const ACK_KIND = "it_security";
export const ACK_VERSION = "2026-01";

export const ACK_TITLE = "IT, Security & Confidentiality Acknowledgment";

/** Each clause renders as a checklist item. Kept as plain strings so the record
 *  of what was agreed to is exactly what the employee saw. */
export const ACK_CLAUSES: { heading: string; text: string }[] = [
  {
    heading: "My device",
    text: "I work on a Windows computer that is kept up to date and running current antivirus, has full-disk encryption (BitLocker) enabled, requires a password to log in, and locks the screen automatically when idle. My work computer is not shared with anyone else.",
  },
  {
    heading: "My network",
    text: "My home network uses WPA2 or WPA3 Wi-Fi with the default router password changed. I never do client work over public or unsecured Wi-Fi.",
  },
  {
    heading: "My accounts",
    text: "I enable two-factor authentication (2FA) on every work account and use a password manager with strong, unique passwords. I do not share my logins.",
  },
  {
    heading: "Confidentiality (NDA)",
    text: "I will keep all client and company information confidential, during and after my time with the firm. I will keep client data only in approved company tools — never in personal email, personal cloud storage, or USB drives — keep my screen private and lock my computer when I step away, securely shred any printed client material, and return or delete all client data if I leave.",
  },
  {
    heading: "Background check",
    text: "I confirm I am 18 or older and legally authorized to work in the United States, and I consent to a background check.",
  },
];

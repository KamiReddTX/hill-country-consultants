/** Per-state B2B cold-contact rules surfaced in the prospecting module.
 *  GENERAL COMPLIANCE INFORMATION, NOT LEGAL ADVICE — telemarketing law changes
 *  often and applies differently by facts. Confirm with counsel before a campaign,
 *  especially in Florida. Sources reviewed 2026-08 (see prospecting docs).
 *
 *  Federal baseline that applies everywhere:
 *   • National Do-Not-Call registry: true business-to-business calls are generally
 *     EXEMPT — but that exemption does NOT cover state DNC lists, wireless/TCPA, or email.
 *   • TCPA: autodialed/prerecorded calls or texts to a WIRELESS number can require
 *     prior express consent even B2B — and many small-business numbers are cell phones.
 *     Manual dialing of business landlines is the lowest-risk path. Scrub + flag wireless.
 *   • CAN-SPAM applies to B2B email: physical mailing address on every send, a working
 *     opt-out honored within 10 days (writes to email_suppression automatically).
 *   • Calling hours: federal floor is 8 a.m.–9 p.m. in the CALLED party's local time.
 */

export type ContactRisk = "high" | "elevated" | "standard";

export interface StateContactRule {
  code: string;
  name: string;
  stateDnc: boolean;        // maintains its own Do-Not-Call list to scrub in addition to federal
  registration: boolean;    // telemarketer registration/permit generally required (exemptions vary; B2B often exempt)
  risk: ContactRisk;
  callingHours: string;     // called party's local time
  summary: string;
}

export const FEDERAL_BASELINE =
  "Federal TCPA + CAN-SPAM apply nationwide. Business-to-business calls are generally exempt from the national Do-Not-Call registry, but state DNC lists, wireless/TCPA rules, and email opt-out still apply — the reveal path scrubs before returning a number.";

export const STATE_CONTACT_RULES: Record<string, StateContactRule> = {
  FL: {
    code: "FL", name: "Florida", stateDnc: true, registration: false, risk: "high",
    callingHours: "8 a.m.–8 p.m. (stricter than federal)",
    summary:
      "Highest litigation risk. The Florida Telephone Solicitation Act (FTSA) is a mini-TCPA with a private right of action; the 2023 amendment (HB 761) narrowed it to UNSOLICITED autodialed/pre-recorded sales calls and texts, requiring prior express written consent (exceptions: existing business relationship, response to a request, existing debt/contract). No autodial or texting Florida numbers without consent. Scrub the Florida DNC. Manual calls to a business's main line are the lowest-risk approach.",
  },
  TX: {
    code: "TX", name: "Texas", stateDnc: true, registration: true, risk: "elevated",
    callingHours: "9 a.m.–9 p.m. weekdays; 12–9 p.m. Sunday (state-specific)",
    summary:
      "Telemarketer registration + a security bond are generally required (Business & Commerce Code Ch. 302), though many B2B sellers and certain categories are exempt — confirm your exemption. Texas runs its own No-Call list; scrub it.",
  },
  LA: {
    code: "LA", name: "Louisiana", stateDnc: true, registration: true, risk: "elevated",
    callingHours: "8 a.m.–9 p.m.",
    summary:
      "Registration generally required, and Louisiana maintains its own Do-Not-Call list (Public Service Commission) in addition to the federal registry — scrub both.",
  },
  AL: {
    code: "AL", name: "Alabama", stateDnc: false, registration: true, risk: "standard",
    callingHours: "8 a.m.–9 p.m.",
    summary:
      "The Alabama Telemarketing Act generally requires registration unless an exemption applies (B2B and certain sellers may qualify). No separate state DNC list beyond federal.",
  },
  GA: {
    code: "GA", name: "Georgia", stateDnc: false, registration: false, risk: "standard",
    callingHours: "8 a.m.–9 p.m.",
    summary:
      "No state telemarketer registration requirement. Follow the federal baseline (TCPA/CAN-SPAM, calling hours) and the Georgia Fair Business Practices Act.",
  },
  NV: {
    code: "NV", name: "Nevada", stateDnc: false, registration: false, risk: "standard",
    callingHours: "8 a.m.–9 p.m.",
    summary:
      "No state telemarketer registration requirement (NRS Ch. 599). Follow the federal baseline.",
  },
};

/** The B2B-priority territory, in the order HCC cares about them. */
export const PRIORITY_STATES = ["GA", "TX", "AL", "LA", "FL", "NV"] as const;

export const ruleForState = (code?: string | null): StateContactRule | null =>
  code ? STATE_CONTACT_RULES[code.trim().toUpperCase()] ?? null : null;

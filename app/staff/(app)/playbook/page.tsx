import { redirect } from "next/navigation";
import { getStaffMember, isSalesOrAdmin } from "@/lib/staff";

const SECTIONS = [
  { t: "Qualify", lines: ["Confirm it's a business or organization, and an adult decision-maker.", "Find the one thing that hurts most today — lead the conversation there.", "Offer the free 30-minute strategy session; never pressure a same-call close."] },
  { t: "Scope & price in writing", lines: ["Nothing starts without written scope and price. À la carte rates are starting points, subject to scope.", "Standalone projects are paid in full at booking, or as set out in the written quote.", "Anything beyond a plan allotment is quoted before it's done."] },
  { t: "Attribution", lines: ["Every lead you log carries your employee code — it's how commission is attributed.", "Convert a won lead from the Pipeline; it creates the client stamped with your code.", "Commission pays only after three months' retention, released by an admin."] },
  { t: "Handoff", lines: ["On close, the account lead runs week-one onboarding: kickoff, credential handoff, task board, file structure.", "Credentials move through the shared password manager — never email, never plain text.", "You stay on Follow-ups for accounts carrying your code."] },
  { t: "All sales final", lines: ["Set the expectation before payment: all sales are final, and the client accepts the Terms and Refund policy at checkout.", "If something's wrong, they contact us first — no chargebacks. The signed scope and delivery record are the record."] },
];

export default async function PlaybookPage() {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");
  if (!isSalesOrAdmin(me)) return <p className="text-[15px] prose-muted">The playbook is for sales and admins.</p>;
  return (
    <div className="flex flex-col gap-6">
      <div><h1 className="font-fraunces text-[32px] font-normal text-forest">Sales playbook</h1><span className="rule-gold mb-4 mt-2" /><p className="text-[13px] prose-muted">Internal — do not share outside the firm.</p></div>
      {SECTIONS.map((s) => (
        <section key={s.t} className="border-t border-line-soft pt-4">
          <h2 className="font-fraunces text-[20px] font-medium text-forest">{s.t}</h2>
          <ul className="mt-2 flex flex-col gap-2">{s.lines.map((l, i) => <li key={i} className="text-[15px] prose-soft">{l}</li>)}</ul>
        </section>
      ))}
    </div>
  );
}

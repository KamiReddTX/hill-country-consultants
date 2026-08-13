import { signOutStaff } from "@/app/staff/actions";
export function StaffSignOut() {
  return (
    <form action={signOutStaff}>
      <button className="min-h-touch text-[13.5px] font-medium text-ink-muted hover:text-forest">Sign out</button>
    </form>
  );
}

import { signOut } from "@/app/portal/actions";
export function SignOutButton() {
  return (
    <form action={signOut}>
      <button className="min-h-touch text-[14px] font-medium text-ink-muted hover:text-forest">Sign out</button>
    </form>
  );
}

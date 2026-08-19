import { redirect } from "next/navigation";

// The Admin tab has been retired. Its cross-client queues (work-log approvals and
// bookings/revenue) now live on the Dashboard for managers; per-client management
// is on the Clients tab, and team pay is on Payroll. Old links land on the Dashboard.
export default function AdminRedirect() {
  redirect("/staff");
}

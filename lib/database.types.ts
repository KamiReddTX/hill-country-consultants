/**
 * Typed shape of the Supabase schema (supabase/schema.sql).
 * Regenerate anytime with:
 *   npx supabase gen types typescript --project-id <ref> > lib/database.types.ts
 * Kept hand-written here so the app is type-safe before the CLI is wired.
 */

export type Role =
  | "Virtual assistant"
  | "Sales / account manager"
  | "Submittals specialist"
  | "Documentation specialist"
  | "Design specialist"
  | "Media / publishing"
  | "Grants specialist"
  | "Administrator";

export type ClientStatus = "In review" | "Active" | "Paused" | "Offboarded";

export interface Database {
  public: {
    Tables: {
      staff: {
        Row: {
          id: string;
          user_id: string | null;
          email: string;
          name: string | null;
          role: Role;
          roles: string[];
          rate: number;
          employee_code: string | null;
          hourly: boolean;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          email: string;
          name?: string | null;
          role?: Role;
          roles?: string[];
          rate?: number;
          employee_code?: string | null;
          hourly?: boolean;
          active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["staff"]["Insert"]>;
      };
      client_assignments: {
        Row: { id: string; client_id: string; staff_id: string; role_on_account: string | null; added_by: string | null; created_at: string };
        Insert: { id?: string; client_id: string; staff_id: string; role_on_account?: string | null; added_by?: string | null };
        Update: Partial<Database["public"]["Tables"]["client_assignments"]["Insert"]>;
      };
      clients: {
        Row: {
          id: string;
          user_id: string | null;
          email: string;
          business: string | null;
          contact: string | null;
          phone: string | null;
          status: ClientStatus;
          assigned_to: string;
          rep_code: string;
          created_at: string;
          retained_since: string | null;
          kickoff_at: string | null;
          roadmap_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          email: string;
          business?: string | null;
          contact?: string | null;
          phone?: string | null;
          status?: ClientStatus;
          assigned_to?: string;
          rep_code?: string;
          retained_since?: string | null;
          kickoff_at?: string | null;
          roadmap_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["clients"]["Insert"]>;
      };
      client_roadmap: {
        Row: { id: string; client_id: string; phase: string; status: string; note: string | null; updated_at: string };
        Insert: { id?: string; client_id: string; phase: string; status?: string; note?: string | null; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["client_roadmap"]["Insert"]>;
      };
      bookings: {
        Row: {
          id: string;
          client_id: string;
          ref: string;
          booked_on: string;
          start_date: string | null;
          items: BookingItem[];
          quotes: BookingQuote[];
          paid_cents: number;
          pay_mode: "full" | "deposit";
          class_name: string | null;
          class_date: string | null;
          class_slot: string | null;
          notes: string | null;
          stripe_payment_intent: string | null;
          created_at: string;
          // added by supabase/migrations/0001_booking_consent.sql
          consent_at: string | null;
          consent_ip: string | null;
          consent_terms: boolean | null;
          scope_snapshot: unknown | null;
        };
        Insert: {
          id?: string;
          client_id: string;
          ref: string;
          booked_on?: string;
          start_date?: string | null;
          items?: BookingItem[];
          quotes?: BookingQuote[];
          paid_cents?: number;
          pay_mode?: "full" | "deposit";
          class_name?: string | null;
          class_date?: string | null;
          class_slot?: string | null;
          notes?: string | null;
          stripe_payment_intent?: string | null;
          consent_at?: string | null;
          consent_ip?: string | null;
          consent_terms?: boolean | null;
          scope_snapshot?: unknown | null;
        };
        Update: Partial<Database["public"]["Tables"]["bookings"]["Insert"]>;
      };
      client_tasks: {
        Row: {
          id: string;
          client_id: string;
          title: string;
          service: string | null;
          due_date: string | null;
          column_name: string;
          paid: boolean;
          booking_ref: string | null;
          created_by: string;
          created_at: string;
          details: string | null;
          approved_at: string | null;
          needs_clarification: boolean;
          charge_cents: number | null;
          charge_status: string;
          assignee_id: string | null;
        };
        Insert: {
          id?: string;
          client_id: string;
          title: string;
          assignee_id?: string | null;
          service?: string | null;
          due_date?: string | null;
          column_name?: string;
          paid?: boolean;
          booking_ref?: string | null;
          created_by?: string;
          details?: string | null;
          approved_at?: string | null;
          needs_clarification?: boolean;
          charge_cents?: number | null;
          charge_status?: string;
        };
        Update: Partial<Database["public"]["Tables"]["client_tasks"]["Insert"]>;
      };
      client_task_files: {
        Row: { id: string; task_id: string; client_id: string; name: string; path: string; size: number | null; uploaded_by: string; created_at: string };
        Insert: { id?: string; task_id: string; client_id: string; name: string; path: string; size?: number | null; uploaded_by?: string };
        Update: Partial<Database["public"]["Tables"]["client_task_files"]["Insert"]>;
      };
      client_reports: {
        Row: { id: string; client_id: string; name: string; path: string; period_start: string | null; period_end: string | null; created_at: string };
        Insert: { id?: string; client_id: string; name: string; path: string; period_start?: string | null; period_end?: string | null };
        Update: Partial<Database["public"]["Tables"]["client_reports"]["Insert"]>;
      };
      staff_reset_requests: {
        Row: { id: string; email: string; status: string; requested_at: string; handled_by: string | null; handled_at: string | null };
        Insert: { id?: string; email: string; status?: string; handled_by?: string | null; handled_at?: string | null };
        Update: Partial<Database["public"]["Tables"]["staff_reset_requests"]["Insert"]>;
      };
      client_files: {
        Row: { id: string; client_id: string; name: string; path: string; size: number | null; uploaded_by: string | null; created_at: string };
        Insert: { id?: string; client_id: string; name: string; path: string; size?: number | null; uploaded_by?: string | null };
        Update: Partial<Database["public"]["Tables"]["client_files"]["Insert"]>;
      };
      client_notes: {
        Row: { id: string; client_id: string; body: string; sender: string; author_name: string | null; created_at: string };
        Insert: { id?: string; client_id: string; body: string; sender?: string; author_name?: string | null };
        Update: Partial<{ body: string; sender: string; author_name: string | null }>;
      };
      client_vault: {
        // Credential REGISTER only — never a password column.
        Row: {
          id: string;
          client_id: string;
          name: string;
          username: string | null;
          url: string | null;
          purpose: string | null;
          needs_resync: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          name: string;
          username?: string | null;
          url?: string | null;
          purpose?: string | null;
          needs_resync?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["client_vault"]["Insert"]>;
      };
      client_work_log: {
        Row: {
          id: string;
          client_id: string;
          worked_on: string;
          service: string | null;
          task: string | null;
          performed_by: string | null;
          hours: number;
          created_at: string;
          approved: boolean;
          approved_by: string | null;
          approved_at: string | null;
        };
        Insert: {
          id?: string;
          client_id: string;
          worked_on: string;
          service?: string | null;
          task?: string | null;
          performed_by?: string | null;
          hours?: number;
          approved?: boolean;
          approved_by?: string | null;
          approved_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["client_work_log"]["Insert"]>;
      };
      client_deliverables: {
        Row: {
          id: string;
          client_id: string;
          name: string;
          service: string | null;
          status: string;
          file_url: string | null;
          delivered_on: string | null;
        };
        Insert: {
          id?: string;
          client_id: string;
          name: string;
          service?: string | null;
          status?: string;
          file_url?: string | null;
          delivered_on?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["client_deliverables"]["Insert"]>;
      };
      leads: {
        Row: {
          id: string;
          business: string | null;
          contact: string | null;
          email: string | null;
          phone: string | null;
          industry: string | null;
          timeline: string | null;
          pain: string | null;
          lead_with: string | null;
          tier: string | null;
          stage: string;
          next_step: string | null;
          next_touch: string | null;
          rep_name: string | null;
          rep_code: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          business?: string | null;
          contact?: string | null;
          email?: string | null;
          phone?: string | null;
          industry?: string | null;
          timeline?: string | null;
          pain?: string | null;
          lead_with?: string | null;
          tier?: string | null;
          stage?: string;
          next_step?: string | null;
          next_touch?: string | null;
          rep_name?: string | null;
          rep_code?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["leads"]["Insert"]>;
      };
      punches: {
        Row: {
          id: string;
          staff_id: string;
          started_at: string;
          ended_at: string | null;
          hours: number | null;
          note: string | null;
          closed_by_admin: boolean;
        };
        Insert: {
          id?: string;
          staff_id: string;
          started_at?: string;
          ended_at?: string | null;
          hours?: number | null;
          note?: string | null;
          closed_by_admin?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["punches"]["Insert"]>;
      };
      timesheet_approvals: {
        Row: {
          id: string;
          staff_id: string;
          period_start: string;
          period_end: string;
          approved_by: string | null;
          approved_at: string;
        };
        Insert: {
          id?: string;
          staff_id: string;
          period_start: string;
          period_end: string;
          approved_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["timesheet_approvals"]["Insert"]>;
      };
    };
    Functions: {
      create_client_after_payment: {
        Args: {
          p_email: string;
          p_business: string;
          p_contact: string;
          p_phone: string;
          p_ref: string;
          p_items: BookingItem[];
          p_quotes: BookingQuote[];
          p_paid_cents: number;
          p_start: string;
          p_rep_code?: string;
        };
        Returns: string;
      };
      is_staff: { Args: Record<string, never>; Returns: boolean };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      my_role: { Args: Record<string, never>; Returns: string };
      mark_kickoff_scheduled: { Args: Record<string, never>; Returns: undefined };
      client_approve_task: { Args: { p_task: string }; Returns: undefined };
      client_request_changes: { Args: { p_task: string }; Returns: undefined };
    };
  };
}

export interface BookingItem {
  id: string;
  name: string;
  qty?: number;
  svc: string;
  price: number;
}
export interface BookingQuote {
  id: string;
  name: string;
  from: string;
}

// Convenience row aliases
export type StaffRow = Database["public"]["Tables"]["staff"]["Row"];
export type ClientRow = Database["public"]["Tables"]["clients"]["Row"];
export type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];
export type ClientTaskRow = Database["public"]["Tables"]["client_tasks"]["Row"];
export type VaultRow = Database["public"]["Tables"]["client_vault"]["Row"];
export type PunchRow = Database["public"]["Tables"]["punches"]["Row"];
export type LeadRow = Database["public"]["Tables"]["leads"]["Row"];

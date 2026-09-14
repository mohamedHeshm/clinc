import { supabase } from "@/lib/supabase";

export interface AuditLogEntry {
  id: string;
  admin_id: string;
  admin_name: string;
  action_type: string;
  target_table: string | null;
  target_id: string | null;
  description: string;
  created_at: string;
}

export async function fetchAuditLog(limit = 50): Promise<AuditLogEntry[]> {
  const { data, error } = await supabase
    .from("admin_actions")
    .select("*, profiles!admin_actions_admin_id_fkey(full_name)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    admin_id: row.admin_id,
    admin_name: (row.profiles as unknown as { full_name: string })?.full_name ?? "الأدمن",
    action_type: row.action_type,
    target_table: row.target_table,
    target_id: row.target_id,
    description: row.description,
    created_at: row.created_at,
  }));
}

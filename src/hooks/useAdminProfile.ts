import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export interface AdminProfile {
  user_id: string;
  email: string | null;
  is_owner: boolean;
  sections: string[];
  active: boolean;
}

/**
 * The caller's own admin_profiles row. This MIRRORS the RLS gate so the UI can
 * hide what the database would refuse — it is never the boundary itself. The
 * `has_section()` policies in 0015 are.
 */
export function useAdminProfile() {
  const { session } = useAuth();
  const userId = session?.user.id;

  const query = useQuery({
    queryKey: ["admin", "profile", userId],
    enabled: !!userId,
    retry: 0,
    staleTime: 60_000,
    queryFn: async (): Promise<AdminProfile | null> => {
      const { data, error } = await supabase
        .from("admin_profiles")
        .select("user_id, email, is_owner, sections, active")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return (data as AdminProfile) ?? null;
    },
  });

  const profile = query.data ?? null;
  const isOwner = !!profile?.is_owner;
  const isActive = !!profile?.active;

  const hasSection = (key: string) =>
    isOwner || (isActive && (profile?.sections.includes(key) ?? false));

  return {
    profile,
    isOwner,
    isActive,
    hasSection,
    isLoading: !!userId && query.isLoading,
    isError: query.isError,
  };
}

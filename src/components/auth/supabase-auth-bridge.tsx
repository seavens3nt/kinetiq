"use client";

import { useEffect } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

export function SupabaseAuthBridge() {
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange(() => undefined);
    return () => data.subscription.unsubscribe();
  }, []);

  return null;
}

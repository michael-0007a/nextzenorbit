/**
 * useUser — Client-side auth state hook
 *
 * Subscribes to Supabase auth state changes.
 * Returns the current user, loading state, and signOut function.
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface UseUserReturn {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Get initial session
    let active = true;
    let authChanged = false;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active || authChanged) return;
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch(() => {
      if (active) setLoading(false);
    });

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      authChanged = true;
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
  }, []);

  return { user, loading, signOut };
}


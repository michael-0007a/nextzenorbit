"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function acceptTerms() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ has_agreed_to_terms: true })
    .eq("user_id", user.id);

  if (error) {
    console.error("Error accepting terms:", error);
    return { error: "Failed to update profile. Please try again." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

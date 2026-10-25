"use client";

import { useState, useSyncExternalStore } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

const KEY = "orbit-ai-limits-notice-v1";
const onStorage = (change: () => void) => { window.addEventListener("storage", change); return () => window.removeEventListener("storage", change); };

/** One-time announcement of the daily AI allowances; dismissal is remembered per browser. */
export function AiLimitsNotice({ audience }: { audience: "client" | "admin" }) {
  // Server render and blocked storage count as "seen", so the notice never flashes or nags.
  const seen = useSyncExternalStore(onStorage, () => { try { return localStorage.getItem(KEY); } catch { return "seen"; } }, () => "seen");
  const [dismissed, setDismissed] = useState(false);
  const open = !seen && !dismissed;
  const close = () => { setDismissed(true); try { localStorage.setItem(KEY, "seen"); } catch { /* ignore */ } };
  return <Modal open={open} onClose={close} title="New: daily AI allowances" size="md">
    <div className="space-y-3 text-sm text-text-secondary">
      {audience === "client" ? <>
        <p>To keep AI fast and fair for everyone, AI features now have daily allowances that reset at <strong>00:00 GMT</strong>:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Resume optimize / improve:</strong> 10 a day on Silver, 15 on Gold, 20 on Elite</li>
          <li><strong>Cover letters:</strong> 30 a day</li>
          <li><strong>Other AI tools</strong> (analyzer, suggestions, notes, LinkedIn, mock interviews): 50 a day</li>
        </ul>
        <p>Only successful results count. You can see what is left under each AI button.</p>
      </> : <>
        <p>AI generation now has daily allowances per admin, reset at <strong>00:00 GMT</strong>:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Admins:</strong> 50 resume generations, 100 cover letters, 100 uploads a day</li>
          <li><strong>Supervisors:</strong> 150 / 300 / 300 a day</li>
        </ul>
        <p>Need more? Use <strong>Request more from a supervisor</strong> under the generate button. Supervisors approve requests under <strong>AI Limits</strong> in the sidebar.</p>
      </>}
      <div className="flex justify-end pt-2"><Button onClick={close}>Got it</Button></div>
    </div>
  </Modal>;
}

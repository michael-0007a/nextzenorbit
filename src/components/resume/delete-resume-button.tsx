"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";

export function DeleteResumeButton({ title, endpoint, scope = "This removes the saved resume, its version history, and its attached original file. Separately generated resumes and downloaded copies remain.", onDeleted }: {
  title: string; endpoint: string; scope?: string; onDeleted: () => void;
}) {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  const close = () => { if (!pending.current) { setStep(0); setConfirmation(""); setError(""); } };
  async function remove() {
    if (step !== 2 || confirmation !== "DELETE" || pending.current) return;
    pending.current = true; setBusy(true); setError("");
    try {
      const response = await fetch(endpoint, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmation: "DELETE" }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || "Deletion failed. Please retry.");
      setStep(0); setConfirmation(""); toast.success("Permanently deleted."); onDeleted();
    } catch (e) { setError(e instanceof Error ? e.message : "Deletion failed. Please retry."); }
    finally { pending.current = false; setBusy(false); }
  }
  return <>
    <button type="button" aria-label={`Delete ${title}`} onClick={e => { e.stopPropagation(); setStep(1); }} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-error hover:bg-error/10"><Trash2 className="h-4 w-4" />Delete</button>
    {step > 0 && createPortal(<div onClick={e => e.stopPropagation()}>
      <Modal open onClose={close} title={step === 1 ? "Delete permanently? · 1 of 2" : "Final confirmation · 2 of 2"} closeOnOverlayClick={!busy} hideCloseButton={busy}>
        <div className="space-y-4">
          <p className="break-words font-medium">{title}</p>
          <p className="text-sm text-text-secondary">{scope} This cannot be undone in the app.</p>
          {step === 2 && <label className="block text-sm">Type DELETE to confirm permanent deletion
            <input aria-label="Type DELETE to confirm" autoComplete="off" value={confirmation} disabled={busy} onChange={e => setConfirmation(e.target.value)} className="mt-2 block w-full rounded-lg border border-border bg-background px-3 py-2" />
          </label>}
          {error && <p role="alert" className="text-sm text-error">{error}</p>}
          <div className="flex justify-end gap-3">
            <button type="button" disabled={busy} onClick={close} className="rounded-lg border border-border px-4 py-2 text-sm">Cancel</button>
            {step === 1 ? <button type="button" onClick={() => setStep(2)} className="rounded-lg bg-error/10 px-4 py-2 text-sm text-error">Continue to final confirmation</button>
              : <button type="button" disabled={busy || confirmation !== "DELETE"} onClick={remove} className="rounded-lg bg-error px-4 py-2 text-sm text-white disabled:opacity-40">{busy ? "Deleting…" : "Delete forever"}</button>}
          </div>
        </div>
      </Modal>
    </div>, document.body)}
  </>;
}

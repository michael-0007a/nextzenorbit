"use client";
import { useRef, useState } from "react";
import { UploadCloud, FileText, CheckCircle2, X } from "lucide-react";

export function ResumeFileUpload({ file, onChange, disabled, error }: { file: File | null; onChange: (file: File | null) => void; disabled: boolean; error?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState("");
  function choose(files: FileList | null) {
    if (disabled || !files?.length) return;
    const selected = files[0];
    if (files.length !== 1) { setLocalError("Please select one resume."); return; }
    if (!/\.(pdf|docx)$/i.test(selected.name)) { setLocalError("Choose a PDF or Word (.docx) file."); return; }
    if (!selected.size || selected.size > 5 * 1024 * 1024) { setLocalError("Choose a non-empty file up to 5 MB."); return; }
    setLocalError(""); onChange(selected);
  }
  return <div className="space-y-2">
    <input ref={input} id="resume-file" name="file" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" disabled={disabled} className="sr-only" aria-label="Choose resume" aria-describedby="resume-file-help resume-file-error" onChange={event => choose(event.target.files)} />
    <div onDragOver={event => { event.preventDefault(); if (!disabled) setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); choose(event.dataTransfer.files); }}
      className={`rounded-2xl border-2 border-dashed p-5 transition-colors ${dragging ? "border-primary bg-primary/10" : file ? "border-primary/40 bg-primary/5" : "border-border bg-surface/40"}`}>
      {file ? <div className="flex items-start gap-3">
        <div className="rounded-xl bg-primary/10 p-3 text-primary"><FileText className="h-6 w-6" /></div>
        <div className="min-w-0 flex-1"><p className="break-all text-sm font-semibold">{file.name}</p><p className="mt-1 text-xs text-text-secondary">{(file.size / 1024 / 1024).toFixed(2)} MB · {file.name.split(".").pop()?.toUpperCase()}</p><p className="mt-2 flex items-center gap-1 text-xs text-primary"><CheckCircle2 className="h-3.5 w-3.5" />Ready to submit</p></div>
        <button type="button" disabled={disabled} aria-label="Remove selected resume" onClick={() => { onChange(null); setLocalError(""); if (input.current) input.current.value = ""; }} className="rounded-lg p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
      </div> : <div className="text-center"><UploadCloud className="mx-auto mb-3 h-8 w-8 text-primary" /><p className="font-medium text-sm">Drop your resume here</p><p className="mt-1 text-xs text-text-secondary">PDF or Word document · Up to 5 MB</p></div>}
      <button type="button" disabled={disabled} onClick={() => input.current?.click()} className="mt-4 w-full rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/20 disabled:opacity-50">{file ? "Choose a different file" : "Browse files"}</button>
    </div>
    <p id="resume-file-help" className="text-xs text-text-secondary">Your original document will be securely available to the review team.</p>
    <p id="resume-file-error" role={localError || error ? "alert" : undefined} className="text-xs text-error">{localError || error}</p>
  </div>;
}

"use client";
import { useEffect, useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";

type UploadedFile = { bucket: string; name: string; size: number; created_at: string };
export function AdminOriginalFiles({ userId }: { userId: string }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [downloading, setDownloading] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError("");
    fetch(`/api/admin/users/${userId}/files`, { signal: controller.signal }).then(async response => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || "Unable to load files.");
      setFiles(result.files);
    }).catch(error => { if (!controller.signal.aborted) setError(error.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [userId, retry]);
  async function download(file: UploadedFile) {
    setDownloading(`${file.bucket}/${file.name}`); setError("");
    try {
      const response = await fetch(`/api/admin/users/${userId}/files?${new URLSearchParams({ bucket: file.bucket, name: file.name })}`);
      if (!response.ok) { const result = await response.json(); throw new Error(result.error?.message || "Download failed."); }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a"); link.href = url; link.download = file.name;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) { setError(e instanceof Error ? e.message : "Download failed."); }
    finally { setDownloading(""); }
  }
  return <section id="original-files" className="glass-card rounded-2xl p-6 space-y-4 scroll-mt-6">
    <div><h3 className="font-semibold flex items-center gap-2"><FileText className="h-5 w-5 text-accent" />Original uploaded files</h3><p className="mt-1 text-sm text-text-secondary">Download the original PDF or Word document supplied by this client.</p></div>
    {loading && <p className="text-sm text-text-secondary" role="status">Loading files…</p>}
    {error && <p role="alert" className="text-sm text-error">{error} <button onClick={() => setRetry(value => value + 1)} className="underline">Retry</button></p>}
    {!loading && !error && files.length === 0 && <p className="text-sm text-text-secondary">No original files found.</p>}
    {files.map(file => <div key={`${file.bucket}/${file.name}`} className="flex items-center gap-3 rounded-xl border border-border p-3">
      <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium" title={file.name}>{file.name}</p><p className="text-xs text-text-secondary">{Math.max(1, Math.round(file.size / 1024))} KB · {new Date(file.created_at).toLocaleDateString()}</p></div>
      <button disabled={Boolean(downloading)} onClick={() => download(file)} className="flex shrink-0 items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary disabled:opacity-50">{downloading === `${file.bucket}/${file.name}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}Download</button>
    </div>)}
  </section>;
}

/**
 * Job Search Client — Client Component
 *
 * Interactive job search form + results + queue management.
 * Uses Adzuna API via /api/jobs/search, adds to queue via /api/jobs/queue.
 */

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    MapPin,
    Building2,
    ExternalLink,
    Plus,
    Check,
    Loader2,
    ListFilter,
    Clock,
    Rocket,
    AlertCircle,
    Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import type { JobQueueRow } from "@/types/database";

interface AdzunaJob {
    id: string;
    title: string;
    company: string;
    location: string;
    salary_text: string;
    description: string;
    job_url: string;
    created: string;
}

interface JobSearchClientProps {
    defaultRole: string;
    defaultLocation: string;
    resumes: { id: string; title: string; updated_at: string }[];
    queuedJobs: JobQueueRow[];
}

export function JobSearchClient({
    defaultRole,
    defaultLocation,
    resumes,
    queuedJobs: initialQueue,
}: JobSearchClientProps) {
    const [query, setQuery] = useState(defaultRole);
    const [location, setLocation] = useState(defaultLocation);
    const [searching, setSearching] = useState(false);
    const [results, setResults] = useState<AdzunaJob[]>([]);
    const [totalResults, setTotalResults] = useState(0);
    const [selectedResumeId, setSelectedResumeId] = useState(resumes[0]?.id || "");
    const [queuedUrls, setQueuedUrls] = useState<Set<string>>(
        new Set(initialQueue.map((j) => j.job_url))
    );
    const [addingJobs, setAddingJobs] = useState<Set<string>>(new Set());
    const [showQueue, setShowQueue] = useState(false);
    const [queue, setQueue] = useState<JobQueueRow[]>(initialQueue);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) {
            toast.error("Please enter a job title or keyword.");
            return;
        }

        setSearching(true);
        try {
            const res = await fetch("/api/jobs/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: query.trim(),
                    location: location.trim() || undefined,
                    resultsPerPage: 20,
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                toast.error(data.error?.message || "Search failed. Please try again.");
                return;
            }

            setResults(data.data.jobs || []);
            setTotalResults(data.data.totalResults || 0);

            if ((data.data.jobs || []).length === 0) {
                toast.info("No jobs found. Try different keywords or location.");
            }
        } catch {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setSearching(false);
        }
    };

    const addToQueue = async (job: AdzunaJob) => {
        setAddingJobs((prev) => new Set(prev).add(job.id));
        try {
            const res = await fetch("/api/jobs/queue", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jobs: [
                        {
                            title: job.title,
                            company: job.company,
                            job_url: job.job_url,
                            location: job.location,
                            salary_text: job.salary_text,
                            description: job.description,
                            source: "adzuna",
                        },
                    ],
                    resume_id: selectedResumeId || null,
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                toast.error(data.error?.message || "Failed to add to queue.");
                return;
            }

            if (data.data.added > 0) {
                setQueuedUrls((prev) => new Set(prev).add(job.job_url));
                setQueue((prev) => [...(data.data.jobs || []), ...prev]);
                toast.success(`Added "${job.title}" to auto-apply queue.`);
            } else {
                toast.info("Job is already in your queue.");
            }
        } catch {
            toast.error("Something went wrong.");
        } finally {
            setAddingJobs((prev) => {
                const next = new Set(prev);
                next.delete(job.id);
                return next;
            });
        }
    };

    const addAllToQueue = async () => {
        const newJobs = results.filter((j) => !queuedUrls.has(j.job_url));
        if (newJobs.length === 0) {
            toast.info("All jobs are already in your queue.");
            return;
        }

        setSearching(true);
        try {
            const res = await fetch("/api/jobs/queue", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jobs: newJobs.map((job) => ({
                        title: job.title,
                        company: job.company,
                        job_url: job.job_url,
                        location: job.location,
                        salary_text: job.salary_text,
                        description: job.description,
                        source: "adzuna",
                    })),
                    resume_id: selectedResumeId || null,
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                toast.error(data.error?.message || "Failed to add jobs.");
                return;
            }

            const addedUrls = new Set(queuedUrls);
            newJobs.forEach((j) => addedUrls.add(j.job_url));
            setQueuedUrls(addedUrls);
            setQueue((prev) => [...(data.data.jobs || []), ...prev]);
            toast.success(`Added ${data.data.added} job(s) to auto-apply queue.`);
        } catch {
            toast.error("Something went wrong.");
        } finally {
            setSearching(false);
        }
    };

    const statusColor: Record<string, string> = {
        pending: "bg-warning/10 text-warning border-warning/30",
        processing: "bg-secondary/10 text-secondary border-secondary/30",
        applied: "bg-success/10 text-success border-success/30",
        failed: "bg-error/10 text-error border-error/30",
        skipped: "bg-white/5 text-text-secondary border-border",
    };

    return (
        <div className="space-y-6">
            {/* Search Form */}
            <Card>
                <CardBody>
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Job Title / Keywords"
                                placeholder="React Developer, Full Stack, Data Scientist"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                leftAddon={<Search className="h-4 w-4" />}
                            />
                            <Input
                                label="Location"
                                placeholder="Bangalore, Mumbai, Remote"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                leftAddon={<MapPin className="h-4 w-4" />}
                            />
                        </div>

                        {/* Resume selector */}
                        {resumes.length > 0 && (
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-foreground">
                                    Resume for auto-apply
                                </label>
                                <select
                                    value={selectedResumeId}
                                    onChange={(e) => setSelectedResumeId(e.target.value)}
                                    className="w-full h-10 rounded-2xl border border-border bg-white/5 px-3 text-sm text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/30 outline-none transition-colors"
                                >
                                    {resumes.map((r) => (
                                        <option key={r.id} value={r.id}>
                                            {r.title}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <Button
                                type="submit"
                                variant="primary"
                                isLoading={searching}
                                disabled={!query.trim()}
                            >
                                <Search className="h-4 w-4 mr-2" />
                                Search Jobs
                            </Button>

                            <button
                                type="button"
                                onClick={() => setShowQueue(!showQueue)}
                                className="flex items-center gap-2 text-sm text-text-secondary hover:text-foreground transition-colors"
                            >
                                <ListFilter className="h-4 w-4" />
                                Queue ({queue.length})
                            </button>
                        </div>
                    </form>
                </CardBody>
            </Card>

            {/* Queue Panel */}
            <AnimatePresence>
                {showQueue && queue.length > 0 && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Rocket className="h-5 w-5 text-primary" />
                                    Auto-Apply Queue
                                </CardTitle>
                            </CardHeader>
                            <CardBody>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {queue.map((job) => (
                                        <div
                                            key={job.id}
                                            className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-white/5 p-3 text-sm"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-foreground truncate">
                                                    {job.title}
                                                </p>
                                                <p className="text-text-secondary text-xs truncate">
                                                    {job.company}{job.location ? ` · ${job.location}` : ""}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {job.screenshot_url && (
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                const res = await fetch(`/api/jobs/screenshot?jobId=${job.id}`);
                                                                const result = await res.json();
                                                                if (result.success && result.data?.url) {
                                                                    window.open(result.data.url, "_blank");
                                                                } else {
                                                                    alert(result.error?.message || "Could not load screenshot");
                                                                }
                                                            } catch {
                                                                alert("Failed to load screenshot");
                                                            }
                                                        }}
                                                        className="text-primary hover:text-primary-light transition-colors cursor-pointer"
                                                        title="View proof screenshot"
                                                    >
                                                        <Camera className="h-4 w-4" />
                                                    </button>
                                                )}
                                                <span
                                                    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${statusColor[job.status] || ""}`}
                                                >
                                                    {job.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardBody>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Results */}
            {results.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-text-secondary">
                            Showing {results.length} of {totalResults.toLocaleString()} results
                        </p>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={addAllToQueue}
                            disabled={searching}
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Add All to Queue
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        <AnimatePresence>
                            {results.map((job, i) => {
                                const isQueued = queuedUrls.has(job.job_url);
                                const isAdding = addingJobs.has(job.id);

                                return (
                                    <motion.div
                                        key={job.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                    >
                                        <Card className="hover:border-primary/40 transition-colors">
                                            <CardBody className="flex gap-4">
                                                {/* Job Info */}
                                                <div className="flex-1 min-w-0 space-y-2">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <h3 className="font-semibold text-foreground leading-tight">
                                                            {job.title}
                                                        </h3>
                                                        <a
                                                            href={job.job_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="shrink-0 text-text-secondary hover:text-primary transition-colors"
                                                            title="Open job listing"
                                                        >
                                                            <ExternalLink className="h-4 w-4" />
                                                        </a>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-3 text-sm text-text-secondary">
                                                        <span className="flex items-center gap-1">
                                                            <Building2 className="h-3.5 w-3.5" />
                                                            {job.company}
                                                        </span>
                                                        {job.location && (
                                                            <span className="flex items-center gap-1">
                                                                <MapPin className="h-3.5 w-3.5" />
                                                                {job.location}
                                                            </span>
                                                        )}
                                                        {job.salary_text !== "Not specified" && (
                                                            <span className="text-primary font-medium">
                                                                {job.salary_text}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <p className="text-sm text-text-secondary line-clamp-2">
                                                        {job.description}
                                                    </p>

                                                    {job.created && (
                                                        <p className="flex items-center gap-1 text-xs text-text-secondary">
                                                            <Clock className="h-3 w-3" />
                                                            {new Date(job.created).toLocaleDateString("en-IN", {
                                                                day: "numeric",
                                                                month: "short",
                                                                year: "numeric",
                                                            })}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Action */}
                                                <div className="flex items-center">
                                                    {isQueued ? (
                                                        <div className="flex items-center gap-1.5 text-sm text-success">
                                                            <Check className="h-4 w-4" />
                                                            Queued
                                                        </div>
                                                    ) : (
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            onClick={() => addToQueue(job)}
                                                            disabled={isAdding}
                                                        >
                                                            {isAdding ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <>
                                                                    <Plus className="h-4 w-4 mr-1" />
                                                                    Queue
                                                                </>
                                                            )}
                                                        </Button>
                                                    )}
                                                </div>
                                            </CardBody>
                                        </Card>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </div>
            )}

            {/* Empty state */}
            {!searching && results.length === 0 && (
                <Card>
                    <CardBody className="text-center py-12">
                        <div className="flex justify-center mb-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                                <Search className="h-8 w-8 text-primary" />
                            </div>
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            Search for jobs
                        </h3>
                        <p className="text-text-secondary max-w-md mx-auto">
                            Enter a job title and location to find opportunities. Add them to your
                            auto-apply queue and let the system handle the rest.
                        </p>
                        {!query && defaultRole && (
                            <p className="text-sm text-primary mt-4 flex items-center justify-center gap-1.5">
                                <AlertCircle className="h-4 w-4" />
                                Tip: Your preferred role &quot;{defaultRole}&quot; is pre-filled from your profile.
                            </p>
                        )}
                    </CardBody>
                </Card>
            )}
        </div>
    );
}

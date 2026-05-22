/**
 * Adzuna API Client
 *
 * Free job search API — no rate limit concerns for development.
 * Searches real job listings by role + location.
 *
 * API Docs: https://developer.adzuna.com/
 */

import { z } from "zod";

// ── Types ──

export interface AdzunaJob {
    id: string;
    title: string;
    company: string;
    location: string;
    salary_text: string;
    description: string;
    job_url: string;
    created: string;
}

export interface AdzunaSearchParams {
    query: string;
    location?: string;
    page?: number;
    resultsPerPage?: number;
    salaryMin?: number;
    salaryMax?: number;
    fullTime?: boolean;
    sortBy?: "date" | "relevance" | "salary";
}

export interface AdzunaSearchResult {
    jobs: AdzunaJob[];
    totalResults: number;
    page: number;
    resultsPerPage: number;
}

// ── Validation ──

export const adzunaSearchSchema = z.object({
    query: z.string().min(1, "Search query is required").max(200),
    location: z.string().max(100).optional().default(""),
    page: z.number().int().min(1).optional().default(1),
    resultsPerPage: z.number().int().min(1).max(50).optional().default(20),
    salaryMin: z.number().int().min(0).optional(),
    salaryMax: z.number().int().min(0).optional(),
    fullTime: z.boolean().optional(),
    sortBy: z.enum(["date", "relevance", "salary"]).optional().default("relevance"),
});

// ── API Client ──

const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID || "";
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY || "";
const ADZUNA_BASE_URL = "https://api.adzuna.com/v1/api/jobs";
const ADZUNA_COUNTRY = "in"; // India

/**
 * Search for jobs using the Adzuna API.
 */
export async function searchAdzunaJobs(
    params: AdzunaSearchParams
): Promise<AdzunaSearchResult> {
    const {
        query,
        location = "",
        page = 1,
        resultsPerPage = 20,
        salaryMin,
        salaryMax,
        fullTime,
        sortBy = "relevance",
    } = params;

    const searchParams = new URLSearchParams({
        app_id: ADZUNA_APP_ID,
        app_key: ADZUNA_APP_KEY,
        results_per_page: String(resultsPerPage),
        what: query,
    });

    if (sortBy && sortBy !== "relevance") searchParams.set("sort_by", sortBy);

    if (location) searchParams.set("where", location);
    if (salaryMin) searchParams.set("salary_min", String(salaryMin));
    if (salaryMax) searchParams.set("salary_max", String(salaryMax));
    if (fullTime !== undefined) searchParams.set("full_time", fullTime ? "1" : "0");

    const url = `${ADZUNA_BASE_URL}/${ADZUNA_COUNTRY}/search/${page}?${searchParams.toString()}`;

    const response = await fetch(url, {
        headers: { "Accept": "application/json" },
        next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Adzuna API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    // Transform Adzuna response to our format
    const jobs: AdzunaJob[] = (data.results || []).map(
        (result: Record<string, unknown>) => ({
            id: String(result.id || ""),
            title: String(result.title || "").replace(/<\/?[^>]+(>|$)/g, ""), // Strip HTML tags
            company: (result.company as Record<string, unknown>)?.display_name
                ? String((result.company as Record<string, unknown>).display_name)
                : "Unknown Company",
            location: (result.location as Record<string, unknown>)?.display_name
                ? String((result.location as Record<string, unknown>).display_name)
                : "",
            salary_text: formatSalary(
                result.salary_min as number | undefined,
                result.salary_max as number | undefined
            ),
            description: String(result.description || "").replace(/<\/?[^>]+(>|$)/g, ""),
            job_url: String(result.redirect_url || ""),
            created: String(result.created || ""),
        })
    );

    return {
        jobs,
        totalResults: data.count || 0,
        page,
        resultsPerPage,
    };
}

function formatSalary(min?: number, max?: number): string {
    if (!min && !max) return "Not specified";
    const fmt = (n: number) =>
        `₹${n.toLocaleString("en-IN")}`;
    if (min && max) return `${fmt(min)} - ${fmt(max)}`;
    if (min) return `From ${fmt(min)}`;
    return `Up to ${fmt(max!)}`;
}

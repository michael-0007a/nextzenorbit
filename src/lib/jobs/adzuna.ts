/**
 * Adzuna API Client
 *
 * Shared server-side Adzuna search adapter.
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
    country?: string; source?: string; catalog_id?: string;
    salary_min?: number | null; salary_max?: number | null; salary_predicted?: boolean;
    contract_type?: string; work_arrangement?: "remote" | "hybrid" | "onsite" | "unknown";
    first_seen?: string; last_checked?: string;
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
    country?: string;
    exclude?: string; maxDaysOld?: number; employment?: "any" | "permanent" | "contract";
}

export interface AdzunaSearchResult {
    jobs: AdzunaJob[];
    totalResults: number;
    page: number;
    resultsPerPage: number;
}

// ── Validation ──

export const adzunaSearchSchema = z.object({
    query: z.string().trim().min(1, "Search query is required").max(200),
    location: z.string().trim().max(100).optional().default(""),
    exclude: z.string().trim().max(200).default(""),
    maxDaysOld: z.number().int().min(1).max(365).optional(),
    employment: z.enum(["any", "permanent", "contract"]).default("any"),
    page: z.number().int().min(1).max(1000).optional().default(1),
    resultsPerPage: z.number().int().min(1).max(50).optional().default(20),
    salaryMin: z.number().int().min(0).optional(),
    salaryMax: z.number().int().min(0).optional(),
    fullTime: z.boolean().optional(),
    sortBy: z.enum(["date", "relevance", "salary"]).optional().default("relevance"),
    country: z.enum(["us", "gb", "in", "ca", "au", "nz", "za", "sg"]).optional().default("us"),
}).refine(value => value.salaryMin === undefined || value.salaryMax === undefined || value.salaryMax >= value.salaryMin, { path: ["salaryMax"], message: "Maximum salary must be at least the minimum." });

// ── API Client ──

const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID || "";
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY || "";
const ADZUNA_BASE_URL = "https://api.adzuna.com/v1/api/jobs";

/**
 * Search for jobs using the Adzuna API.
 */
export async function searchAdzunaJobs(
    params: AdzunaSearchParams
): Promise<AdzunaSearchResult> {
    if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) throw new Error("Adzuna credentials are not configured.");
    const {
        query,
        location = "",
        page = 1,
        resultsPerPage = 20,
        salaryMin,
        salaryMax,
        fullTime,
        sortBy = "relevance",
        country = "us", exclude = "", maxDaysOld, employment = "any",
    } = params;

    const searchParams = new URLSearchParams({
        app_id: ADZUNA_APP_ID,
        app_key: ADZUNA_APP_KEY,
        results_per_page: String(resultsPerPage),
        what: query,
    });

    if (sortBy && sortBy !== "relevance") searchParams.set("sort_by", sortBy);

    if (exclude) searchParams.set("what_exclude", exclude);
    if (maxDaysOld) searchParams.set("max_days_old", String(maxDaysOld));
    if (employment !== "any") searchParams.set(employment, "1");
    if (location && !/^remote$/i.test(location)) searchParams.set("where", location);
    if (salaryMin) searchParams.set("salary_min", String(salaryMin));
    if (salaryMax) searchParams.set("salary_max", String(salaryMax));
    if (fullTime !== undefined) searchParams.set("full_time", fullTime ? "1" : "0");

    const url = `${ADZUNA_BASE_URL}/${country}/search/${page}?${searchParams.toString()}`;

    const fetchPage = () => fetch(url, {
        signal: AbortSignal.timeout(15000),
        headers: { "Accept": "application/json" },
        next: { revalidate: 300 }, // Cache for 5 minutes
    });

    let response = await fetchPage();
    if ([429,502,503,504].includes(response.status)) {
        await new Promise(resolve => setTimeout(resolve, 500));
        response = await fetchPage();
    }
    if (!response.ok) {
        throw new Error(`Adzuna search unavailable (${response.status}).`);
    }

    const data = await response.json();

    // Transform Adzuna response to our format
    const jobs: AdzunaJob[] = (data.results || []).map(
        (result: Record<string, unknown>) => ({
            id: String(result.id || ""), country, source: "adzuna",
            salary_min: typeof result.salary_min === "number" ? result.salary_min : null,
            salary_max: typeof result.salary_max === "number" ? result.salary_max : null,
            salary_predicted: String(result.salary_is_predicted) === "1",
            contract_type: String(result.contract_type || "Unknown"),
            work_arrangement: /\bhybrid\b/i.test(String(result.description)) ? "hybrid" : /\b(remote|work from home)\b/i.test(String(result.description)) ? "remote" : "unknown",
            last_checked: new Date().toISOString(),
            title: String(result.title || "").replace(/<\/?[^>]+(>|$)/g, ""), // Strip HTML tags
            company: (result.company as Record<string, unknown>)?.display_name
                ? String((result.company as Record<string, unknown>).display_name)
                : "Unknown Company",
            location: (result.location as Record<string, unknown>)?.display_name
                ? String((result.location as Record<string, unknown>).display_name)
                : "",
            salary_text: formatSalary(
                result.salary_min as number | undefined,
                result.salary_max as number | undefined,
                country
            ),
            description: String(result.description || "").replace(/<\/?[^>]+(>|$)/g, ""),
            job_url: String(result.redirect_url || ""),
            created: String(result.created || ""),
        })
    );

    return {
        jobs: [...new Map(jobs.filter(job => job.id && /^https?:\/\//i.test(job.job_url)).map(job => [job.id, job])).values()],
        totalResults: data.count || 0,
        page,
        resultsPerPage,
    };
}

export function formatSalary(min?: number, max?: number, country = "us"): string {
    if (!min && !max) return "Not specified";
    const currencies: Record<string, string> = { us: "USD", gb: "GBP", in: "INR", ca: "CAD", au: "AUD", nz: "NZD", za: "ZAR", sg: "SGD" };
    const fmt = (n: number) => new Intl.NumberFormat("en", { style: "currency", currency: currencies[country] || "USD", currencyDisplay: "code", maximumFractionDigits: 0 }).format(n);
    if (min && max) return `${fmt(min)} - ${fmt(max)}`;
    if (min) return `From ${fmt(min)}`;
    return `Up to ${fmt(max!)}`;
}

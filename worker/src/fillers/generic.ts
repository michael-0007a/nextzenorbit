/**
 * Generic Form Filler — AI-Powered
 *
 * Uses Groq/LLaMA to detect form fields from HTML and fills them automatically.
 * This is the fallback when hardcoded selectors don't exist for a job site.
 */

import type { Page } from "playwright";
import Groq from "groq-sdk";
import { extractFormHtml } from "../browser.js";
import type { UserProfile, ResumeContent } from "../supabase.js";
import type { FillResult } from "./indeed.js";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

interface FieldMapping {
    selector: string;
    field: string;
    type: "text" | "email" | "tel" | "file" | "select" | "textarea";
}

/**
 * Use AI to detect form fields and map them to user data.
 */
async function detectFormFields(formHtml: string): Promise<FieldMapping[]> {
    // Truncate HTML to avoid token limits
    const truncatedHtml = formHtml.slice(0, 8000);

    const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
            {
                role: "system",
                content: `You are a form analysis expert. Given HTML of a job application form, identify all input fields and map them to standard user profile fields.

Return a JSON array of objects with these properties:
- "selector": CSS selector to target the field (use id, name, or aria-label)
- "field": which user data to fill. One of: "name", "email", "phone", "location", "linkedin", "experience_years", "current_company", "current_title", "cover_letter", "resume_upload", "salary_expectation", "skills", "portfolio", "github"
- "type": input type - "text", "email", "tel", "file", "select", "textarea"

Only include fields you can confidently identify. Return ONLY the JSON array, no explanation.`,
            },
            {
                role: "user",
                content: `Analyze this form HTML and return the field mapping:\n\n${truncatedHtml}`,
            },
        ],
        temperature: 0.1,
        max_tokens: 2000,
        response_format: { type: "json_object" },
    });

    const responseText = completion.choices[0]?.message?.content || "[]";

    try {
        const parsed = JSON.parse(responseText);
        // Handle both { fields: [...] } and [...] formats
        const fields = Array.isArray(parsed) ? parsed : parsed.fields || [];
        return fields as FieldMapping[];
    } catch {
        console.error("[AI] Failed to parse field mapping:", responseText.slice(0, 200));
        return [];
    }
}

/**
 * Get the value for a mapped field from user data.
 */
function getFieldValue(
    field: string,
    profile: UserProfile,
    resume: ResumeContent,
    email: string
): string {
    switch (field) {
        case "name":
            return resume.contact.full_name || profile.full_name;
        case "email":
            return resume.contact.email || email;
        case "phone":
            return resume.contact.phone || profile.phone || "";
        case "location":
            return resume.contact.location || profile.location || "";
        case "linkedin":
            return resume.contact.linkedin_url || profile.linkedin_url || "";
        case "portfolio":
            return resume.contact.portfolio_url || "";
        case "github":
            return resume.contact.github_url || "";
        case "experience_years":
            return String(profile.years_of_experience || "");
        case "current_company":
            return resume.experience?.[0]?.company || "";
        case "current_title":
            return resume.experience?.[0]?.position || profile.preferred_role || "";
        case "skills":
            return resume.skills?.flatMap((s) => s.items).join(", ") || "";
        case "cover_letter":
            return ""; // Will be filled separately if needed
        default:
            return "";
    }
}

/**
 * Fill form fields using AI-detected mapping.
 */
export async function fillGenericForm(
    page: Page,
    profile: UserProfile,
    resume: ResumeContent,
    email: string
): Promise<FillResult> {
    const errors: string[] = [];
    let fieldsFound = 0;
    let fieldsFilled = 0;

    try {
        // 1. Extract form HTML
        const formHtml = await extractFormHtml(page);
        if (!formHtml) {
            return {
                success: false,
                fieldsFound: 0,
                fieldsFilled: 0,
                errors: ["No form found on page"],
            };
        }

        console.log(`[AI] Analyzing form HTML (${formHtml.length} chars)...`);

        // 2. Detect fields with AI
        const mappings = await detectFormFields(formHtml);
        fieldsFound = mappings.length;
        console.log(`[AI] Detected ${fieldsFound} form fields`);

        // 3. Fill each field
        for (const mapping of mappings) {
            if (mapping.type === "file") {
                errors.push(`File upload field skipped: ${mapping.field}`);
                continue;
            }

            const value = getFieldValue(mapping.field, profile, resume, email);
            if (!value) continue;

            try {
                const element = await page.$(mapping.selector);
                if (element) {
                    if (mapping.type === "select") {
                        await element.selectOption({ label: value }).catch(async () => {
                            // Try by value
                            await element.selectOption(value).catch(() => { });
                        });
                    } else {
                        await element.fill(value);
                    }
                    fieldsFilled++;
                    console.log(`  ✓ Filled ${mapping.field}: ${value.slice(0, 30)}...`);
                } else {
                    console.log(`  ✗ Selector not found: ${mapping.selector}`);
                }
            } catch (err) {
                errors.push(
                    `Failed to fill ${mapping.field}: ${err instanceof Error ? err.message : String(err)}`
                );
            }
        }

        console.log(`[AI] Filled ${fieldsFilled}/${fieldsFound} fields`);
    } catch (err) {
        errors.push(`Generic fill error: ${err instanceof Error ? err.message : String(err)}`);
    }

    return {
        success: fieldsFilled > 0,
        fieldsFound,
        fieldsFilled,
        errors,
    };
}

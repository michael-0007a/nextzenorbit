/**
 * Indeed Form Filler
 *
 * Hardcoded selectors for Indeed Easy Apply forms.
 * This is the fast, reliable path for the most predictable forms.
 */

import type { Page } from "playwright";
import type { UserProfile, ResumeContent } from "../supabase.js";

export interface FillResult {
    success: boolean;
    fieldsFound: number;
    fieldsFilled: number;
    errors: string[];
}

/**
 * Check if the current page is an Indeed job page.
 */
export function isIndeedPage(url: string): boolean {
    return url.includes("indeed.com") || url.includes("indeed.co.in");
}

/**
 * Fill Indeed Easy Apply form fields.
 */
export async function fillIndeedForm(
    page: Page,
    profile: UserProfile,
    resume: ResumeContent,
    email: string
): Promise<FillResult> {
    const errors: string[] = [];
    let fieldsFound = 0;
    let fieldsFilled = 0;

    try {
        // Wait for the page to be ready
        await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => { });

        // Check for Easy Apply button first
        const applyButton = await page.$(
            '[class*="apply"], button:has-text("Apply"), a:has-text("Apply now"), [data-testid*="apply"]'
        );

        if (applyButton) {
            await applyButton.click();
            await page.waitForTimeout(2000);
        }

        // ── Fill Name Fields ──
        const nameSelectors = [
            '#input-applicant\\.name',
            'input[name="applicant.name"]',
            'input[name="name"]',
            'input[placeholder*="name" i]',
            'input[aria-label*="name" i]',
        ];

        for (const sel of nameSelectors) {
            const el = await page.$(sel);
            if (el) {
                fieldsFound++;
                await el.fill(resume.contact.full_name || profile.full_name);
                fieldsFilled++;
                break;
            }
        }

        // ── Fill Email ──
        const emailSelectors = [
            '#input-applicant\\.email',
            'input[name="applicant.email"]',
            'input[name="email"]',
            'input[type="email"]',
            'input[placeholder*="email" i]',
        ];

        for (const sel of emailSelectors) {
            const el = await page.$(sel);
            if (el) {
                fieldsFound++;
                await el.fill(resume.contact.email || email);
                fieldsFilled++;
                break;
            }
        }

        // ── Fill Phone ──
        const phoneSelectors = [
            '#input-applicant\\.phoneNumber',
            'input[name="applicant.phoneNumber"]',
            'input[name="phone"]',
            'input[type="tel"]',
            'input[placeholder*="phone" i]',
        ];

        for (const sel of phoneSelectors) {
            const el = await page.$(sel);
            if (el) {
                fieldsFound++;
                const phone = resume.contact.phone || profile.phone || "";
                if (phone) {
                    await el.fill(phone);
                    fieldsFilled++;
                }
                break;
            }
        }

        // ── Fill Location ──
        const locationSelectors = [
            'input[name="location"]',
            'input[placeholder*="city" i]',
            'input[placeholder*="location" i]',
        ];

        for (const sel of locationSelectors) {
            const el = await page.$(sel);
            if (el) {
                fieldsFound++;
                const loc = resume.contact.location || profile.location || "";
                if (loc) {
                    await el.fill(loc);
                    fieldsFilled++;
                }
                break;
            }
        }

        // ── Upload Resume ──
        const fileInput = await page.$('input[type="file"]');
        if (fileInput) {
            fieldsFound++;
            // Skip resume upload for now — would need PDF generation
            errors.push("Resume file upload detected but skipped (needs PDF file)");
        }

        console.log(`[Indeed] Found ${fieldsFound} fields, filled ${fieldsFilled}`);
    } catch (err) {
        errors.push(`Form fill error: ${err instanceof Error ? err.message : String(err)}`);
    }

    return {
        success: fieldsFilled > 0 && errors.length === 0,
        fieldsFound,
        fieldsFilled,
        errors,
    };
}

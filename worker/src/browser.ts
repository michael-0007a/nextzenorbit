/**
 * Worker — Playwright Browser Manager
 *
 * Handles browser lifecycle, page creation, and anti-detection.
 * Does NOT block images — screenshots need full visual fidelity.
 */

import { chromium, type Browser, type BrowserContext, type Page } from "playwright";

let browser: Browser | null = null;

const HEADLESS = process.env.HEADLESS !== "false";

/**
 * Launch or reuse the browser instance.
 */
export async function getBrowser(): Promise<Browser> {
    if (browser && browser.isConnected()) {
        return browser;
    }

    console.log(`[Browser] Launching ${HEADLESS ? "headless" : "headed"} browser...`);

    browser = await chromium.launch({
        headless: HEADLESS,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-blink-features=AutomationControlled",
        ],
    });

    return browser;
}

/**
 * Create a new browser context with realistic settings.
 */
export async function createContext(): Promise<BrowserContext> {
    const b = await getBrowser();

    const context = await b.newContext({
        viewport: { width: 1366, height: 768 },
        userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        locale: "en-IN",
        timezoneId: "Asia/Kolkata",
    });

    return context;
}

/**
 * Open a page for a given URL.
 */
export async function openPage(url: string): Promise<{ context: BrowserContext; page: Page }> {
    const context = await createContext();
    const page = await context.newPage();

    console.log(`[Browser] Navigating to: ${url}`);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });

    return { context, page };
}

/**
 * Navigate from Adzuna listing to the actual employer application page.
 * Adzuna pages have an "Apply for this job" link that redirects.
 *
 * Handles the Magnific Popup (email signup) that covers the page.
 */
export async function navigateToApplyPage(page: Page): Promise<boolean> {
    try {
        // Step 1: Dismiss the Magnific Popup (email signup overlay)
        // Adzuna uses Magnific Popup library — class: mfp-wrap, close: mfp-close
        console.log("[Browser] Dismissing Adzuna popup...");

        // Press Escape to close any modal
        await page.keyboard.press("Escape");
        await page.waitForTimeout(500);

        // Click the Magnific Popup close button if it exists
        const mfpClose = await page.$(".mfp-close, .mfp-container .mfp-close, button.mfp-close");
        if (mfpClose) {
            await mfpClose.click({ force: true }).catch(() => { });
            await page.waitForTimeout(500);
        }

        // Also try clicking "No, thanks" text link (Adzuna popup has this)
        const noThanks = await page.$('a:has-text("No, thanks"), button:has-text("No, thanks")');
        if (noThanks) {
            await noThanks.click({ force: true }).catch(() => { });
            await page.waitForTimeout(500);
        }

        // Remove the popup from the DOM entirely (nuclear option)
        await page.evaluate(() => {
            document.querySelectorAll(".mfp-wrap, .mfp-bg").forEach((el) => el.remove());
        });
        await page.waitForTimeout(300);

        // Step 2: Extract the apply link href (don't click — navigate directly)
        const applyHref = await page.evaluate(() => {
            // Try CSS selectors that are valid in native DOM
            const cssSelectors = [
                'a[href*="land/ad"]',       // Adzuna's redirect link format
                'a.btn-green',              // Adzuna green CTA button
                'a[class*="apply"]',        // Generic apply class
            ];

            for (const sel of cssSelectors) {
                try {
                    const el = document.querySelector(sel) as HTMLAnchorElement | null;
                    if (el?.href) return el.href;
                } catch { /* skip invalid selectors */ }
            }

            // Fallback: scan all links for "Apply" text
            const allLinks = Array.from(document.querySelectorAll("a"));
            const applyLink = allLinks.find(
                (a) =>
                    a.textContent?.trim().includes("Apply for this job") ||
                    a.textContent?.trim().includes("Apply now") ||
                    a.textContent?.trim() === "Apply"
            ) as HTMLAnchorElement | null;

            return applyLink?.href || null;
        });

        if (applyHref) {
            console.log(`[Browser] Found apply link: ${applyHref.substring(0, 80)}...`);

            // Navigate to the redirect URL — use 'load' and allow redirects
            await page.goto(applyHref, { waitUntil: "load", timeout: 30_000 });

            // Wait for all redirects to complete (Adzuna → employer site)
            // Poll until the URL is no longer on adzuna.in
            for (let i = 0; i < 10; i++) {
                const currentUrl = page.url();
                if (!currentUrl.includes("adzuna.in") && !currentUrl.includes("adzuna.com")) {
                    break;
                }
                console.log(`[Browser] Waiting for redirect... (${currentUrl.substring(0, 60)})`);
                await page.waitForTimeout(2000);
                // Wait for any pending navigation
                await page.waitForLoadState("load").catch(() => { });
            }

            console.log(`[Browser] Final page: ${page.url()}`);
            return true;
        }

        console.log("[Browser] No apply link found on Adzuna page");
        return false;
    } catch (err) {
        console.error("[Browser] Error navigating to apply page:", err);
        return false;
    }
}

/**
 * Add a proof-of-submission overlay to the page before taking a screenshot.
 * Shows timestamp, job details, and "Applied via Nextzen Orbit" watermark.
 */
export async function addProofOverlay(
    page: Page,
    jobTitle: string,
    company: string
): Promise<void> {
    const timestamp = new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "full",
        timeStyle: "medium",
    });

    await page.evaluate(
        ({ jobTitle, company, timestamp }) => {
            const overlay = document.createElement("div");
            overlay.id = "nextzen-proof-overlay";
            overlay.innerHTML = `
                <div style="
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
                    color: #39d98a;
                    padding: 16px 24px;
                    font-family: 'Segoe UI', system-ui, sans-serif;
                    z-index: 999999;
                    border-top: 3px solid #39d98a;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <div>
                        <div style="font-size: 16px; font-weight: 700; margin-bottom: 4px;">
                            ✅ Application Submitted — ${jobTitle}
                        </div>
                        <div style="font-size: 13px; color: #aaa;">
                            ${company} · Applied via <strong style="color: #39d98a;">Nextzen Orbit</strong> · ${timestamp} IST
                        </div>
                    </div>
                    <div style="
                        background: #39d98a;
                        color: #0a0a0a;
                        padding: 8px 16px;
                        border-radius: 6px;
                        font-weight: 700;
                        font-size: 14px;
                    ">
                        PROOF OF SUBMISSION
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
        },
        { jobTitle, company, timestamp }
    );

    // Brief wait for overlay to render
    await page.waitForTimeout(300);
}

/**
 * Extract form HTML from a page for AI analysis.
 */
export async function extractFormHtml(page: Page): Promise<string> {
    const forms = await page.$$eval("form", (formElements: Element[]) =>
        formElements.map((form) => form.outerHTML).join("\n---FORM_SEPARATOR---\n")
    );

    if (forms) return forms;

    const container = await page.$eval(
        '[class*="apply"], [class*="application"], [id*="apply"], [id*="application"]',
        (el: Element) => el.outerHTML
    ).catch(() => "");

    return container || "";
}

/**
 * Close the browser and clean up.
 */
export async function closeBrowser(): Promise<void> {
    if (browser) {
        await browser.close();
        browser = null;
        console.log("[Browser] Closed.");
    }
}

"use server";

import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

// Helper to parse HTML string
function parseHtml(html: string, url: string) {
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    return reader.parse();
}

export async function scrapeUrl(url: string) {
    console.log(`[Scrape] Starting for: ${url}`);

    // 1. Try Fast Mode (Fetch)
    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) width=device-width, initial-scale=1",
            },
            next: { revalidate: 0 },
            signal: AbortSignal.timeout(5000) // 5s timeout for fast fetch
        });

        if (response.ok) {
            const html = await response.text();
            const article = parseHtml(html, url);

            if (article && article.textContent && article.textContent.length > 200) {
                console.log("[Scrape] Fast fetch success.");
                return {
                    success: true,
                    data: {
                        title: article.title,
                        content: article.textContent,
                        siteName: article.siteName || new URL(url).hostname
                    }
                };
            }
        }
    } catch (err) {
        console.warn("[Scrape] Fast fetch failed, switching to Puppeteer:", err);
    }

    // 2. Try Heavy Mode (Puppeteer)
    let browser = null;
    try {
        console.log("[Scrape] Launching Puppeteer...");
        // Dynamically import puppeteer to avoid static analysis issues
        const puppeteer = (await import("puppeteer")).default;

        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

        // Aggressive timeout to prevent hanging
        await page.goto(url, {
            waitUntil: "domcontentloaded",
            timeout: 20000
        });

        // Wait a bit for potential hydration
        // await new Promise(r => setTimeout(r, 1000));

        const html = await page.content();
        await browser.close();
        browser = null;

        const article = parseHtml(html, url);

        if (!article) {
            return { success: false, error: "Unable to parse content from this page." };
        }

        return {
            success: true,
            data: {
                title: article.title,
                content: article.textContent,
                siteName: article.siteName || new URL(url).hostname
            }
        };

    } catch (error) {
        console.error("[Scrape] Puppeteer Error:", error);
        if (browser) {
            try { await browser.close(); } catch (e) { }
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to scrape content"
        };
    }
}

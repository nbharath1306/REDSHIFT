import { NextRequest, NextResponse } from "next/server";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

// Helper to parse HTML string
function parseHtml(html: string, url: string) {
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    return reader.parse();
}

// Helper to ensure URL has protocol
function normalizeUrl(input: string): string {
    if (!input.match(/^https?:\/\//i)) {
        return `https://${input}`;
    }
    return input;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        let { url } = body;

        if (!url) {
            return NextResponse.json({ success: false, error: "URL is required" }, { status: 400 });
        }

        // Validate & Normalize URL
        try {
            url = normalizeUrl(url.trim());
            new URL(url); // Test if valid
        } catch (e) {
            return NextResponse.json({ success: false, error: "Invalid URL format" }, { status: 400 });
        }

        console.log(`[API Scrape] Starting for: ${url}`);

        // 1. Try Fast Mode (Fetch)
        try {
            const response = await fetch(url, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) width=device-width, initial-scale=1",
                },
                signal: AbortSignal.timeout(5000)
            });

            if (response.ok) {
                const html = await response.text();
                const article = parseHtml(html, url);

                if (article && article.textContent && article.textContent.length > 200) {
                    console.log("[API Scrape] Fast fetch success.");
                    return NextResponse.json({
                        success: true,
                        data: {
                            title: article.title,
                            content: article.textContent,
                            siteName: article.siteName || new URL(url).hostname
                        }
                    });
                }
            }
        } catch (err) {
            console.warn("[API Scrape] Fast fetch failed/insufficient, switching to Puppeteer:", err);
        }

        // 2. Try Heavy Mode (Puppeteer)
        let browser = null;
        try {
            console.log("[API Scrape] Launching Puppeteer...");
            const puppeteer = (await import("puppeteer")).default;

            browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const page = await browser.newPage();
            await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

            await page.goto(url, {
                waitUntil: "domcontentloaded",
                timeout: 25000
            });

            const html = await page.content();
            await browser.close();
            browser = null;

            const article = parseHtml(html, url);

            if (!article) {
                return NextResponse.json({ success: false, error: "Unable to parse content" }, { status: 422 });
            }

            return NextResponse.json({
                success: true,
                data: {
                    title: article.title,
                    content: article.textContent,
                    siteName: article.siteName || new URL(url).hostname
                }
            });

        } catch (error) {
            console.error("[API Scrape] Puppeteer Error:", error);
            if (browser) {
                try { await browser.close(); } catch (e) { }
            }
            return NextResponse.json({
                success: false,
                error: error instanceof Error ? error.message : "Failed to scrape content"
            }, { status: 500 });
        }

    } catch (error) {
        return NextResponse.json({
            success: false,
            error: "Internal Server Error"
        }, { status: 500 });
    }
}

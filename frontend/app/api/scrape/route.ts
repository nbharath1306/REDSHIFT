import { NextRequest, NextResponse } from "next/server";
import { load } from "cheerio";

// Helper to ensure URL has protocol
function normalizeUrl(input: string): string {
    if (!input.match(/^https?:\/\//i)) {
        return `https://${input}`;
    }
    return input;
}

// Aggressive Content Extractor using Cheerio
function extractContent(html: string, url: string) {
    const $ = load(html);

    // 1. Remove Junk
    $('script, style, nav, footer, header, aside, iframe, noscript, svg, button, input, form, select, textarea, [role="alert"], [role="banner"], [role="navigation"]').remove();

    // 2. Extract Title
    let title = $('title').text().trim();
    if (!title) {
        title = $('meta[property="og:title"]').attr('content') ||
            $('h1').first().text().trim() ||
            url;
    }

    // 3. Extract Text Content
    // Try to find specific article containers first for better quality
    let content = "";
    const article = $('article, [role="main"], .content, #content, .post, .article');

    if (article.length > 0) {
        content = article.text();
    } else {
        // Fallback: Get body text
        content = $('body').text();
    }

    // 4. Clean Whitespace
    // Replace multiple spaces/newlines with single space
    content = content.replace(/\s+/g, ' ').trim();

    return {
        title,
        content,
        siteName: new URL(url).hostname
    };
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

        console.log(`[API Scrape] Starting Aggressive Scraper for: ${url}`);

        // 1. Try Fast Mode (Fetch)
        try {
            const response = await fetch(url, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) width=device-width, initial-scale=1",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
                },
                next: { revalidate: 0 },
                signal: AbortSignal.timeout(5000)
            });

            if (response.ok) {
                const html = await response.text();
                const data = extractContent(html, url);

                if (data.content && data.content.length > 300) {
                    console.log("[API Scrape] Fast fetch success.");
                    return NextResponse.json({
                        success: true,
                        data
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
            // Stealthy User Agent
            await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

            // Navigate
            await page.goto(url, {
                waitUntil: "domcontentloaded",
                timeout: 30000
            });

            // Wait for body to be populated
            try {
                await page.waitForSelector('body', { timeout: 5000 });
            } catch (e) { }

            const html = await page.content();
            await browser.close();
            browser = null;

            const data = extractContent(html, url);

            if (!data.content || data.content.length < 50) {
                return NextResponse.json({
                    success: false,
                    error: "No readable text found on this page.",
                    details: "The page might be empty or heavily encrypted."
                }, { status: 422 });
            }

            return NextResponse.json({
                success: true,
                data
            });

        } catch (error) {
            console.error("[API Scrape] Puppeteer Error:", error);
            if (browser) {
                try { await browser.close(); } catch (e) { }
            }
            return NextResponse.json({
                success: false,
                error: error instanceof Error ? error.message : "Failed to scrape content",
                details: error instanceof Error ? error.stack : undefined
            }, { status: 500 });
        }

    } catch (error) {
        console.error("[API Scrape] Fatal Handler Error:", error);
        return NextResponse.json({
            success: false,
            error: "Internal Server Error",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

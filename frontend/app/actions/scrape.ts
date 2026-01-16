"use server";

import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import puppeteer from "puppeteer";

export async function scrapeUrl(url: string) {
    let browser;
    try {
        console.log("Launching Puppeteer for:", url);
        // Launch standard Puppeteer
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        // Set User Agent
        await page.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        );

        // Navigate
        console.log("Navigating...");
        await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

        // Get Content
        const html = await page.content();
        console.log("Content retrieved, length:", html.length);

        await browser.close();
        browser = null;

        // Parse
        const dom = new JSDOM(html, { url });
        const reader = new Readability(dom.window.document);
        const article = reader.parse();

        if (!article) {
            return { success: false, error: "Readability could not parse the article content." };
        }

        return {
            success: true,
            data: {
                title: article.title || "Untitled Article",
                content: article.textContent || "",
                siteName: article.siteName || new URL(url).hostname
            }
        };

    } catch (error) {
        console.error("Scraping error:", error);
        if (browser) await browser.close();
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown server error during scraping"
        };
    }
}

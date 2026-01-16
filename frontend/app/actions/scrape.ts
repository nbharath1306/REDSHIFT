"use server";

import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import puppeteer from "puppeteer";

export async function scrapeUrl(url: string) {
    let browser;
    try {
        // Launch standard Puppeteer (Chomium)
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'] // Recommended for containerized environments
        });

        const page = await browser.newPage();

        // Set a realistic User Agent
        await page.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        );

        // Navigate to URL and wait for network to be idle (handles SPAs)
        await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

        // Get the fully rendered HTML
        const html = await page.content();

        await browser.close();
        browser = null; // Prevent double close in finally

        // Parse with Readability
        const dom = new JSDOM(html, { url });
        const reader = new Readability(dom.window.document);
        const article = reader.parse();

        if (!article) {
            throw new Error("Could not parse article content from this URL.");
        }

        return {
            title: article.title || "Untitled Article",
            content: article.textContent || "", // plain text content
            siteName: article.siteName || new URL(url).hostname
        };

    } catch (error) {
        console.error("Scraping error:", error);
        if (browser) await browser.close();
        throw new Error(error instanceof Error ? error.message : "An unknown error occurred while scraping.");
    }
}

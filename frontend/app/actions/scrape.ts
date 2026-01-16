"use server";

import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

export async function scrapeUrl(url: string) {
    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
            },
            next: { revalidate: 3600 } // Cache for 1 hour
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch URL: ${response.statusText}`);
        }

        const html = await response.text();
        const dom = new JSDOM(html, { url });
        const reader = new Readability(dom.window.document);
        const article = reader.parse();

        if (!article) {
            throw new Error("Could not parse article content from this URL.");
        }

        // Return structured data, defaulting if fields are missing
        return {
            title: article.title || "Untitled Article",
            content: article.textContent || "", // plain text content
            siteName: article.siteName || new URL(url).hostname
        };

    } catch (error) {
        console.error("Scraping error:", error);
        throw new Error(error instanceof Error ? error.message : "An unknown error occurred while scraping.");
    }
}

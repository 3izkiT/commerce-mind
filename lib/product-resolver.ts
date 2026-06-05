import * as cheerio from "cheerio";
import { isProductUrl } from "./product-input";

export type ProductPlatform = "tiktok" | "shopee" | "generic";

export interface ResolvedProduct {
  text: string;
  source: "text" | "url";
  originalUrl?: string;
}

export function detectPlatform(url: string): ProductPlatform {
  const lower = url.toLowerCase();
  if (lower.includes("tiktok.com") || lower.includes("shop.tiktok")) {
    return "tiktok";
  }
  if (lower.includes("shopee.")) {
    return "shopee";
  }
  return "generic";
}

async function fetchPageHtml(url: string): Promise<string> {
  const scrapingBeeKey = process.env.SCRAPINGBEE_API_KEY;
  const zenRowsKey = process.env.ZENROWS_API_KEY;

  if (scrapingBeeKey) {
    const apiUrl = `https://app.scrapingbee.com/api/v1/?api_key=${encodeURIComponent(scrapingBeeKey)}&url=${encodeURIComponent(url)}&render_js=true`;
    const res = await fetch(apiUrl);
    if (!res.ok) {
      throw new Error(`ScrapingBee request failed (${res.status})`);
    }
    return res.text();
  }

  if (zenRowsKey) {
    const apiUrl = `https://api.zenrows.com/v1/?apikey=${encodeURIComponent(zenRowsKey)}&url=${encodeURIComponent(url)}&js_render=true`;
    const res = await fetch(apiUrl);
    if (!res.ok) {
      throw new Error(`ZenRows request failed (${res.status})`);
    }
    return res.text();
  }

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "th-TH,th;q=0.9,en;q=0.8",
    },
    redirect: "follow",
  });

  if (!res.ok) {
    throw new Error(`Direct fetch failed (${res.status})`);
  }

  return res.text();
}

function pushUnique(parts: string[], line: string) {
  const normalized = line.trim();
  if (!normalized || parts.some((p) => p.includes(normalized))) return;
  parts.push(normalized);
}

function extractFromJsonLd($: cheerio.Root, parts: string[]) {
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).html();
    if (!raw) return;

    try {
      const data = JSON.parse(raw) as unknown;
      const items = Array.isArray(data) ? data : [data];

      for (const item of items) {
        if (!item || typeof item !== "object") continue;
        const record = item as Record<string, unknown>;
        const type = String(record["@type"] ?? "").toLowerCase();

        if (type.includes("product")) {
          if (typeof record.name === "string") {
            pushUnique(parts, `ชื่อสินค้า: ${record.name}`);
          }
          if (typeof record.description === "string") {
            pushUnique(parts, `รายละเอียด: ${record.description}`);
          }
        }
      }
    } catch {
      // ignore malformed JSON-LD
    }
  });
}

function extractShopeeState(html: string, parts: string[]) {
  const match = html.match(/<script[^>]*>\s*window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?})\s*;\s*<\/script>/i);
  if (!match?.[1]) return;

  try {
    const state = JSON.parse(match[1]) as Record<string, unknown>;
    const item = findNestedValue(state, "item") as Record<string, unknown> | undefined;
    if (!item || typeof item !== "object") return;

    if (typeof item.name === "string") {
      pushUnique(parts, `ชื่อสินค้า: ${item.name}`);
    }
    if (typeof item.description === "string") {
      pushUnique(parts, `รายละเอียด: ${item.description}`);
    }
    if (Array.isArray(item.attributes)) {
      const highlights = item.attributes
        .map((attr) => {
          if (!attr || typeof attr !== "object") return null;
          const record = attr as Record<string, unknown>;
          const name = record.name;
          const value = record.value;
          if (typeof name === "string" && typeof value === "string") {
            return `${name}: ${value}`;
          }
          return null;
        })
        .filter(Boolean)
        .slice(0, 8);

      if (highlights.length > 0) {
        pushUnique(parts, `จุดเด่น:\n- ${highlights.join("\n- ")}`);
      }
    }
  } catch {
    // ignore parse errors
  }
}

function findNestedValue(node: unknown, key: string): unknown {
  if (!node || typeof node !== "object") return undefined;

  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findNestedValue(item, key);
      if (found !== undefined) return found;
    }
    return undefined;
  }

  const record = node as Record<string, unknown>;
  if (key in record) return record[key];

  for (const value of Object.values(record)) {
    const found = findNestedValue(value, key);
    if (found !== undefined) return found;
  }

  return undefined;
}

function extractProductInfo(html: string, platform: ProductPlatform): string {
  const $ = cheerio.load(html);
  const parts: string[] = [];

  const ogTitle = $('meta[property="og:title"]').attr("content")?.trim();
  const twitterTitle = $('meta[name="twitter:title"]').attr("content")?.trim();
  const pageTitle = $("title").text().trim();
  const title = ogTitle || twitterTitle || pageTitle;
  if (title) {
    pushUnique(parts, `ชื่อสินค้า: ${title}`);
  }

  const ogDescription = $('meta[property="og:description"]').attr("content")?.trim();
  const metaDescription = $('meta[name="description"]').attr("content")?.trim();
  const description = ogDescription || metaDescription;
  if (description) {
    pushUnique(parts, `รายละเอียด: ${description}`);
  }

  extractFromJsonLd($, parts);

  if (platform === "shopee") {
    extractShopeeState(html, parts);
  }

  const h1 = $("h1").first().text().trim();
  if (h1) {
    pushUnique(parts, `ชื่อสินค้า: ${h1}`);
  }

  if (parts.length === 0) {
    throw new Error("No product information found in page");
  }

  return parts.join("\n\n");
}

export async function resolveProductInput(input: string): Promise<ResolvedProduct> {
  const trimmed = input.trim();

  if (!isProductUrl(trimmed)) {
    return { text: trimmed, source: "text" };
  }

  const platform = detectPlatform(trimmed);
  const html = await fetchPageHtml(trimmed);
  const text = extractProductInfo(html, platform);

  if (!text.trim()) {
    throw new Error("Empty product information");
  }

  return { text, source: "url", originalUrl: trimmed };
}

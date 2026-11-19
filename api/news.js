"use strict";

const MARKET_LANGUAGES = Object.freeze({
  us: "en",
  uk: "en",
  kr: "ko",
  jp: "ja",
  fr: "fr",
  de: "de"
});

function flattenStories(entries, articles) {
  if (!Array.isArray(entries)) return;
  for (const item of entries) {
    if (!item || typeof item !== "object") continue;
    if (typeof item.title === "string" && typeof item.link === "string") {
      articles.push({
        title: item.title,
        link: item.link,
        source: typeof item.source === "string" ? item.source :
          (typeof item.source?.name === "string" ? item.source.name : ""),
        date: typeof item.date === "string" ? item.date : "",
        snippet: typeof item.snippet === "string" ? item.snippet : ""
      });
    }
    flattenStories(item.stories, articles);
  }
}

function normalizeArticles(newsResults) {
  const collected = [];
  flattenStories(newsResults, collected);
  const seen = new Set();
  return collected.filter(article => {
    let url;
    try {
      url = new URL(article.link);
      if (!["https:", "http:"].includes(url.protocol)) return false;
    } catch {
      return false;
    }
    if (seen.has(url.href)) return false;
    seen.add(url.href);
    return true;
  }).slice(0, 60);
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "GET") return res.status(405).json({error: "Method not allowed."});

  const key = process.env.SERPAPI_KEY;
  if (!key) return res.status(500).json({error: "SERPAPI_KEY is not configured in Vercel."});

  const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (!query || query.length > 180) return res.status(400).json({error: "Enter a search query of 1–180 characters."});
  const gl = typeof req.query.gl === "string" ? req.query.gl : "us";
  if (!Object.hasOwn(MARKET_LANGUAGES, gl)) {
    return res.status(400).json({error: "Unsupported news market."});
  }

  const params = new URLSearchParams({
    engine: "google_news",
    q: query,
    gl,
    hl: MARKET_LANGUAGES[gl],
    api_key: key
  });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 23000);
  try {
    const upstream = await fetch("https://serpapi.com/search.json?" + params, {
      signal: controller.signal,
      headers: {Accept: "application/json"}
    });
    const response = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      if (upstream.status === 429) return res.status(429).json({error: "SerpApi rate limit reached. Please try later."});
      return res.status(502)
        .json({error: response?.error || "SerpApi returned HTTP " + upstream.status + "."});
    }
    if (!response || typeof response !== "object") {
      return res.status(502).json({error: "SerpApi returned an invalid JSON response."});
    }
    if (response.error) {
      return res.status(502).json({error: String(response.error)});
    }
    if (!Array.isArray(response.news_results)) {
      return res.status(502).json({error: "SerpApi did not return a news_results array."});
    }
    return res.status(200).json({
      market: gl,
      language: MARKET_LANGUAGES[gl],
      articles: normalizeArticles(response.news_results)
    });
  } catch (error) {
    return res.status(502).json({
      error: error.name === "AbortError"
        ? "SerpApi took too long to respond."
        : "Unable to connect to SerpApi. Please retry."
    });
  } finally {
    clearTimeout(timer);
  }
};

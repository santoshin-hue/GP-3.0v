# GLOBAL PERSPECTIVE · News Comparison (v3)

A dark-themed, English-language international news comparison tool built with:

- One HTML/CSS/JavaScript page (`index.html`)
- A Vercel serverless proxy (`api/news.js`)
- The real SerpApi Google News API, with `SERPAPI_KEY` stored server-side

There is no AI analysis and no fabricated news data.

## What changed

1. **Country-by-country news results:** choose two or three Google News market editions from the US, UK, South Korea, Japan, France and Germany. Each selected edition costs one SerpApi request.
2. **Headline keyword comparison:** counts the most frequent terms in each edition's returned article titles, excluding words in the search query and common filler terms. Bars show `headlines containing term / returned headlines`. Uses the browser's built-in word segmenter for English, Korean, Japanese, French and German where available.
3. **Article comparison board:** select up to three distinct article links and compare title, publisher, date and search edition side by side. Open each original article in a new tab.

**Important:** A Google News market edition is a *search localization setting*, not proof of the publisher's nationality, an editorial stance, or the opinion of a country. Keyword counts are descriptive, not AI summaries. All source articles belong to their publishers.

## Updating an existing Vercel deployment

1. Unzip this package.
2. In the **same GitHub repository** already linked to Vercel, replace `index.html` and `api/news.js` with the two files in this package. Keep the same folder structure.
3. Commit the changes to your deployed branch. Vercel should start a new deployment automatically.
4. Keep your existing project environment variable `SERPAPI_KEY` unchanged. Never place it in the HTML or commit it to GitHub.
5. When the new deployment shows **Ready**, open your existing Vercel URL, enter `Taiwan Strait`, leave three markets checked, and choose **Compare coverage**.
6. Try the keyword comparison, switch market tabs, and select articles from at least two markets.

If creating a new Vercel project, import a repository with the following files at its root, choose Framework Preset **Other**, set `SERPAPI_KEY` in Project Settings → Environment Variables, then deploy.

```
index.html
api/
  news.js
package.json
README.md
```

The browser calls `/api/news?q=Taiwan&gl=us`. Vercel uses the secret key to request real results from SerpApi and returns a trimmed list of source headlines.

## Costs, errors, and limitations

- Two markets = **two API searches**; three markets = **three API searches**, unless SerpApi itself provides cached results. Monitor your SerpApi account's current plan and remaining quota.
- Each market is requested separately. If a market fails, the others can still display their results, and the failing tab shows an error.
- Search results differ by language, Google's indexing and ranking, and the time of the request; article totals are **returned result counts**, not counts of all articles in the world.
- Keyword segmentation is a simple descriptive count that may be imperfect for Korean/Japanese titles; it does not read article bodies or determine an outlet's position.
- The server endpoint has no login or user-specific rate limiter. Protect your API quota before advertising a publicly accessible URL at scale.
- A locally opened `index.html` file cannot make the Vercel serverless route run. Use the deployed project URL.

## Data source

[SerpApi Google News API](https://serpapi.com/google-news-api). Only its actual `news_results` and nested `stories` are displayed.

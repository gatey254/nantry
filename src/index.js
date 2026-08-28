var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.js
var VERSION = "2.2.0";
var GOOGLE_NEWS_QUERIES = [
  "Nandi County Kenya",
  "Nandi Kenya",
  "Kapsabet Kenya",
  "Nandi County",
  "Kapsabet",
  "Nandi politics",
  "Nandi business",
  "Nandi education",
  "Nandi health",
  "Nandi agriculture",
  "Nandi sports",
  "Nandi entertainment",
  "Nandi roads",
  "Nandi water",
  "Nandi county government",
  "Nandi weather"
];
var YOUTUBE_QUERIES = [
  "Nandi County Kenya",
  "Kapsabet Kenya",
  "Nandi Kenya"
];

// Anchor terms that genuinely place a story in Nandi County, Kenya.
// Deliberately excludes the bare word "nandi" on its own, since that
// also matches unrelated people/places (e.g. "Nandi Madida", a South
// African singer). Every phrase here is multi-word and place-specific.
var ANCHOR_TERMS = [
  "nandi county",
  "nandi county government",
  "county government of nandi",
  "kapsabet",
  "nandi hills",
  "nandi north",
  "nandi south",
  "nandi east",
  "nandi west",
  "aldai constituency",
  "tinderet constituency",
  "chesumei",
  "emgwen",
  "mosop constituency",
  "kilibwoni",
  "chepterit",
  "kabiyet",
  "kaptumo",
  "kipkaren",
  "mosoriot",
  "nandi senator",
  "nandi governor",
  "nandi mca",
  "nandi stadium",
  "kingwal",
  "kabisaga",
  "nandi hills town"
];

var CATEGORY_KEYWORDS = {
  politics: [
    "politics",
    "political",
    "governor",
    "senator",
    "member of parliament",
    " mp ",
    "mca",
    "county government",
    "election",
    "elections",
    "party",
    "government",
    "assembly",
    "president",
    "deputy president",
    "cabinet",
    "county assembly",
    "impeachment",
    "nomination"
  ],
  infrastructure: [
    "road",
    "roads",
    "bridge",
    "bridges",
    "tarmac",
    "highway",
    "construction",
    "contractor",
    "tender",
    "kura",
    "kerra",
    "kenha",
    "electricity",
    "kplc",
    "power outage",
    "blackout",
    "street light",
    "water project",
    "borehole",
    "dam",
    "pipeline",
    "sewer",
    "housing project"
  ],
  land: [
    "land",
    "title deed",
    "title deeds",
    "boundary",
    "boundaries",
    "eviction",
    "squatter",
    "squatters",
    "surveyor",
    "land dispute",
    "land grabbing",
    "settlement scheme"
  ],
  weather: [
    "weather",
    "rain",
    "rains",
    "rainfall",
    "drought",
    "flood",
    "floods",
    "flooding",
    "hailstorm",
    "storm",
    "forecast",
    "m\xE9t\xE9o",
    "kmd"
  ],
  tourism: [
    "tourism",
    "tourist",
    "tourists",
    "hotel",
    "hotels",
    "resort",
    "heritage site",
    "cultural site",
    "eco-tourism",
    "safari",
    "attraction"
  ],
  business: [
    "business",
    "market",
    "markets",
    "trade",
    "company",
    "companies",
    "investment",
    "investor",
    "jobs",
    "job",
    "employment",
    "economy",
    "economic",
    "entrepreneur",
    "startup",
    "money",
    "sacco",
    "cooperative"
  ],
  education: [
    "school",
    "schools",
    "education",
    "student",
    "students",
    "teacher",
    "teachers",
    "university",
    "college",
    "exam",
    "exams",
    "kcse",
    "knec",
    "tvet",
    "campus",
    "learning",
    "bursary",
    "scholarship"
  ],
  health: [
    "health",
    "hospital",
    "hospitals",
    "doctor",
    "doctors",
    "clinic",
    "clinics",
    "medicine",
    "medical",
    "disease",
    "malaria",
    "outbreak",
    "patient",
    "patients",
    "nhif",
    "sha ",
    "maternity"
  ],
  sports: [
    "sport",
    "sports",
    "football",
    "soccer",
    "athletics",
    "athlete",
    "athletes",
    "runner",
    "runners",
    "running",
    "marathon",
    "tournament",
    "match",
    "league",
    "championship",
    "world record",
    "olympics",
    "world championships"
  ],
  crime: [
    "crime",
    "criminal",
    "police",
    "arrest",
    "arrested",
    "murder",
    "killed",
    "robbery",
    "theft",
    "court",
    "fraud",
    "accident",
    "missing",
    "investigation",
    "shot dead",
    "stabbed",
    "assault",
    "kidnap"
  ],
  agriculture: [
    "farm",
    "farmer",
    "farmers",
    "agriculture",
    "maize",
    "milk",
    "dairy",
    "coffee",
    "tea",
    "livestock",
    "cattle",
    "fertilizer",
    "harvest",
    "crop",
    "crops",
    "kenya seed",
    "agrovet",
    "extension officer"
  ],
  entertainment: [
    "music",
    "musician",
    "artist",
    "artists",
    "celebrity",
    "concert",
    "festival",
    "movie",
    "film",
    "entertainment",
    "dj",
    "actor",
    "actress"
  ],
  culture: [
    "chief",
    "chief's baraza",
    "baraza",
    "elder",
    "elders",
    "ceremony",
    "circumcision",
    "cultural",
    "heritage",
    "kalenjin",
    "tradition",
    "traditional"
  ]
};

var index_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    try {
      if (url.pathname === "/") {
        return json({
          ok: true,
          service: "nantry",
          version: VERSION,
          status: "running",
          endpoints: ["/health", "/status", "/collect", "/trends", "/rising", "/topic?query=nandi"],
          webhook: "/telegram/webhook"
        });
      }
      if (url.pathname === "/health") {
        return json({ ok: true, service: "nantry", status: "healthy", time: (/* @__PURE__ */ new Date()).toISOString() });
      }
      if (url.pathname === "/status") {
        return json(await getStatus(env));
      }
      if (url.pathname === "/collect") {
        return json(await collectSignals(env));
      }
      if (url.pathname === "/trends") {
        return json(await getTrends(env));
      }
      if (url.pathname === "/rising") {
        return json(await getRising(env));
      }
      if (url.pathname === "/topic") {
        const query = url.searchParams.get("query");
        if (!query) {
          return json({ ok: false, error: "Missing query parameter. Example: /topic?query=football" }, 400);
        }
        return json(await getTopic(env, query));
      }
      if (url.pathname === "/telegram/webhook") {
        return handleTelegramWebhook(request, env);
      }
      return json({ ok: false, error: "Not found" }, 404);
    } catch (error) {
      console.error(error);
      return json({ ok: false, error: error.message || "Internal error" }, 500);
    }
  },
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(collectSignals(env));
  }
};

// ---- Relevance filtering ----

function isRelevant(text) {
  const value = String(text || "").toLowerCase();
  return ANCHOR_TERMS.some((term) => value.includes(term));
}
__name(isRelevant, "isRelevant");

// ---- Collection ----

async function collectSignals(env) {
  const startedAt = (/* @__PURE__ */ new Date()).toISOString();
  const errors = [];
  const allItems = [];
  let filteredOut = 0;
  if (env.DB) {
    try {
      const recent = await env.DB.prepare(`
        SELECT started_at FROM collection_runs ORDER BY id DESC LIMIT 1
      `).first();
      if (recent?.started_at) {
        const age = Date.now() - new Date(recent.started_at).getTime();
        if (age < 5 * 60 * 1e3) {
          return { ok: true, skipped: true, reason: "Collection ran less than 5 minutes ago" };
        }
      }
    } catch (error) {
      errors.push(`collection lock: ${error.message}`);
    }
  }
  let runId = null;
  if (env.DB) {
    try {
      const result = await env.DB.prepare(`
        INSERT INTO collection_runs (started_at) VALUES (?)
      `).bind(startedAt).run();
      runId = result.meta?.last_row_id || null;
    } catch (error) {
      errors.push(`run start: ${error.message}`);
    }
  }
  for (const query of GOOGLE_NEWS_QUERIES) {
    try {
      const items = await fetchGoogleNews(query);
      for (const item of items) {
        const text = `${item.title} ${item.description}`;
        if (!isRelevant(text)) {
          filteredOut++;
          continue;
        }
        item.source = "google_news";
        item.category = categorize(text);
        item.score = calculateScore(item, "google_news");
        allItems.push(item);
      }
    } catch (error) {
      errors.push(`Google News "${query}": ${error.message}`);
    }
  }
  const trendsUrl = env.GOOGLE_TRENDS_RSS_URL || "https://trends.google.com/trending/rss?geo=KE";
  try {
    const items = await fetchRSS(trendsUrl);
    for (const item of items) {
      const text = `${item.title} ${item.description}`;
      if (!isRelevant(text)) {
        filteredOut++;
        continue;
      }
      item.source = "google_trends";
      item.category = categorize(text);
      item.score = calculateScore(item, "google_trends");
      allItems.push(item);
    }
  } catch (error) {
    errors.push(`Google Trends: ${error.message}`);
  }
  if (env.YOUTUBE_API_KEY) {
    for (const query of YOUTUBE_QUERIES) {
      try {
        const items = await fetchYouTube(env.YOUTUBE_API_KEY, query);
        for (const item of items) {
          const text = `${item.title} ${item.description}`;
          if (!isRelevant(text)) {
            filteredOut++;
            continue;
          }
          item.source = "youtube";
          item.category = categorize(text);
          item.score = calculateScore(item, "youtube");
          allItems.push(item);
        }
      } catch (error) {
        errors.push(`YouTube "${query}": ${error.message}`);
      }
    }
    // Additive: Kenya's trending chart, on top of (not instead of) keyword
    // search above. This is the "what are people watching right now" signal.
    try {
      const trendingItems = await fetchYouTubeTrending(env.YOUTUBE_API_KEY);
      for (const item of trendingItems) {
        const text = `${item.title} ${item.description}`;
        if (!isRelevant(text)) {
          filteredOut++;
          continue;
        }
        item.source = "youtube_trending";
        item.category = categorize(text);
        item.score = calculateScore(item, "youtube_trending");
        allItems.push(item);
      }
    } catch (error) {
      errors.push(`YouTube trending: ${error.message}`);
    }
  }
  let inserted = 0;
  if (env.DB && allItems.length) {
    for (const item of allItems) {
      try {
        const externalId = item.external_id || item.url || item.title;
        const result = await env.DB.prepare(`
          INSERT OR IGNORE INTO source_items
          (source, external_id, title, description, url, category, score, published_at, collected_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          item.source,
          externalId,
          item.title,
          item.description || "",
          item.url || null,
          item.category || "general",
          item.score || 1,
          item.published_at || null,
          startedAt
        ).run();
        inserted += Number(result.meta?.changes || 0);
      } catch (error) {
        errors.push(`D1 insert: ${error.message}`);
      }
    }
  }
  if (env.DB && runId) {
    try {
      await env.DB.prepare(`
        UPDATE collection_runs SET finished_at = ?, fetched = ?, inserted = ?, errors = ? WHERE id = ?
      `).bind((/* @__PURE__ */ new Date()).toISOString(), allItems.length, inserted, errors.length, runId).run();
    } catch (error) {
      console.error("Could not update collection run", error);
    }
  }
  return {
    ok: errors.length === 0,
    fetched: allItems.length,
    filtered_out: filteredOut,
    inserted,
    errors,
    sources: {
      google_news: allItems.filter((x) => x.source === "google_news").length,
      google_trends: allItems.filter((x) => x.source === "google_trends").length,
      youtube: allItems.filter((x) => x.source === "youtube").length,
      youtube_trending: allItems.filter((x) => x.source === "youtube_trending").length
    }
  };
}
__name(collectSignals, "collectSignals");

async function fetchGoogleNews(query) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-KE&gl=KE&ceid=KE:en`;
  return fetchRSS(url);
}
__name(fetchGoogleNews, "fetchGoogleNews");

async function fetchRSS(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "Nantry/2.2 (+https://nantry.wmwirotsi.workers.dev)" }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const xml = await response.text();
  return parseRSS(xml);
}
__name(fetchRSS, "fetchRSS");

function parseRSS(xml) {
  const items = [];
  const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  for (const block of blocks) {
    const title = decodeXML(getTag(block, "title"));
    if (!title) continue;
    const link = getTag(block, "link");
    const description = decodeXML(getTag(block, "description"));
    const published = getTag(block, "pubDate") || getTag(block, "published") || getTag(block, "updated");
    const guid = getTag(block, "guid") || link || title;
    items.push({ external_id: guid, title, description, url: link, published_at: published });
  }
  return items;
}
__name(parseRSS, "parseRSS");

function getTag(text, tag) {
  const regex = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = text.match(regex);
  return match ? match[1].trim() : "";
}
__name(getTag, "getTag");

function decodeXML(value) {
  return String(value || "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'").replace(/\s+/g, " ").trim();
}
__name(decodeXML, "decodeXML");

async function fetchYouTube(apiKey, query) {
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", query);
  url.searchParams.set("type", "video");
  url.searchParams.set("order", "date");
  url.searchParams.set("maxResults", "10");
  url.searchParams.set("regionCode", "KE");
  url.searchParams.set("relevanceLanguage", "en");
  url.searchParams.set("key", apiKey);
  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`HTTP ${response.status}: ${body.slice(0, 200)}`);
  }
  const data = await response.json();
  const items = (data.items || []).filter((item) => item.id?.videoId).map((item) => ({
    external_id: item.id.videoId,
    title: item.snippet?.title || "Untitled",
    description: item.snippet?.description || "",
    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    published_at: item.snippet?.publishedAt || null
  }));
  // Search results don't include engagement stats — fetch them separately
  // so search-sourced items can be scored the same way as trending ones.
  await enrichWithStatistics(apiKey, items);
  return items;
}
__name(fetchYouTube, "fetchYouTube");

// Kenya's currently-trending videos (YouTube's own "what's hot" chart),
// filtered afterwards by isRelevant(). This is a genuine "what are people
// watching right now" signal, distinct from keyword search which only
// finds videos that happen to match a query string.
async function fetchYouTubeTrending(apiKey) {
  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.searchParams.set("part", "snippet,statistics");
  url.searchParams.set("chart", "mostPopular");
  url.searchParams.set("regionCode", "KE");
  url.searchParams.set("maxResults", "25");
  url.searchParams.set("key", apiKey);
  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`HTTP ${response.status}: ${body.slice(0, 200)}`);
  }
  const data = await response.json();
  return (data.items || []).filter((item) => item.id).map((item) => ({
    external_id: item.id,
    title: item.snippet?.title || "Untitled",
    description: item.snippet?.description || "",
    url: `https://www.youtube.com/watch?v=${item.id}`,
    published_at: item.snippet?.publishedAt || null,
    view_count: Number(item.statistics?.viewCount || 0),
    like_count: Number(item.statistics?.likeCount || 0),
    comment_count: Number(item.statistics?.commentCount || 0)
  }));
}
__name(fetchYouTubeTrending, "fetchYouTubeTrending");

async function enrichWithStatistics(apiKey, items) {
  const ids = items.map((i) => i.external_id).filter(Boolean);
  if (!ids.length) return;
  // videos.list accepts up to 50 comma-separated IDs per call.
  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.searchParams.set("part", "statistics");
  url.searchParams.set("id", ids.slice(0, 50).join(","));
  url.searchParams.set("key", apiKey);
  try {
    const response = await fetch(url);
    if (!response.ok) return;
    const data = await response.json();
    const statsById = new Map((data.items || []).map((i) => [i.id, i.statistics || {}]));
    for (const item of items) {
      const stats = statsById.get(item.external_id);
      if (stats) {
        item.view_count = Number(stats.viewCount || 0);
        item.like_count = Number(stats.likeCount || 0);
        item.comment_count = Number(stats.commentCount || 0);
      }
    }
  } catch (error) {
    console.error("YouTube statistics enrichment failed", error.message);
  }
}
__name(enrichWithStatistics, "enrichWithStatistics");

function categorize(text) {
  const value = String(text || "").toLowerCase();
  let bestCategory = "general";
  let bestScore = 0;
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const keyword of keywords) {
      if (value.includes(keyword)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }
  return bestCategory;
}
__name(categorize, "categorize");

function calculateScore(item, source) {
  let score = 1;
  if (source === "google_trends") score += 4;
  if (source === "youtube_trending") score += 3;
  if (source === "youtube") score += 2;
  if (source === "google_news") score += 1;
  if (item.published_at) {
    const time = new Date(item.published_at).getTime();
    if (Number.isFinite(time)) {
      const age = Date.now() - time;
      if (age < 24 * 60 * 60 * 1e3) score += 3;
      else if (age < 72 * 60 * 60 * 1e3) score += 2;
      else if (age < 7 * 24 * 60 * 60 * 1e3) score += 1;
    }
  }
  score += engagementBonus(item);
  return score;
}
__name(calculateScore, "calculateScore");

// Real public interest, not just source/recency. Uses log-scale buckets so
// a video with 2M views doesn't blow the score off the chart relative to
// everything else — it's a bonus on top of the base score, capped modestly.
function engagementBonus(item) {
  let bonus = 0;
  const views = Number(item.view_count || 0);
  const likes = Number(item.like_count || 0);
  const comments = Number(item.comment_count || 0);
  if (views > 0) bonus += Math.min(5, Math.floor(Math.log10(views + 1)));
  if (likes > 0) bonus += Math.min(3, Math.floor(Math.log10(likes + 1)));
  if (comments > 0) bonus += Math.min(2, Math.floor(Math.log10(comments + 1)));
  return bonus;
}
__name(engagementBonus, "engagementBonus");

var TRENDS_SOURCES = [
  { key: "google_news", label: "Google News" },
  { key: "google_trends", label: "Google Trends" },
  { key: "youtube", label: "YouTube" },
  { key: "youtube_trending", label: "YouTube Trending" }
];

async function getStatus(env) {
  const status = {
    ok: true,
    service: "nantry",
    version: VERSION,
    telegram_configured: Boolean(env.TELEGRAM_BOT_TOKEN),
    webhook_secret_configured: Boolean(env.TELEGRAM_WEBHOOK_SECRET),
    d1_configured: Boolean(env.DB),
    youtube_configured: Boolean(env.YOUTUBE_API_KEY),
    google_trends_configured: Boolean(env.GOOGLE_TRENDS_RSS_URL),
    my_chat_id_configured: Boolean(env.MY_CHAT_ID)
  };
  if (env.DB) {
    try {
      const lastRun = await env.DB.prepare(`
        SELECT started_at, finished_at, fetched, inserted, errors
        FROM collection_runs ORDER BY id DESC LIMIT 1
      `).first();
      status.last_run = lastRun || null;
      const totalItems = await env.DB.prepare(`SELECT COUNT(*) AS c FROM source_items`).first();
      status.total_items = totalItems?.c || 0;
      const last24h = await env.DB.prepare(`
        SELECT COUNT(*) AS c FROM source_items WHERE collected_at >= datetime('now', '-24 hours')
      `).first();
      status.items_last_24h = last24h?.c || 0;
      const subscriberCount = await env.DB.prepare(`
        SELECT COUNT(*) AS c FROM chats WHERE enabled = 1
      `).first();
      status.subscriber_count = subscriberCount?.c || 0;
    } catch (error) {
      status.db_error = error.message;
    }
  }
  return status;
}
__name(getStatus, "getStatus");

async function getTrends(env) {
  if (!env.DB) {
    return { ok: false, error: "D1 is not configured.", groups: [] };
  }
  const groups = [];
  for (const s of TRENDS_SOURCES) {
    const result = await env.DB.prepare(`
      SELECT title, url, category, score, published_at, collected_at
      FROM source_items
      WHERE source = ? AND collected_at >= datetime('now', '-7 days')
      ORDER BY score DESC, collected_at DESC
      LIMIT 5
    `).bind(s.key).all();
    groups.push({ source: s.key, label: s.label, stories: result.results || [] });
  }
  return { ok: true, period: "last 7 days", groups };
}
__name(getTrends, "getTrends");

async function getRising(env) {
  if (!env.DB) {
    return { ok: false, error: "D1 is not configured.", rising: [] };
  }
  const result = await env.DB.prepare(`
    WITH current_period AS (
      SELECT category, COUNT(*) AS current_mentions, SUM(score) AS current_score
      FROM source_items
      WHERE collected_at >= datetime('now', '-24 hours')
      GROUP BY category
    ),
    previous_period AS (
      SELECT category, COUNT(*) AS previous_mentions, SUM(score) AS previous_score
      FROM source_items
      WHERE collected_at >= datetime('now', '-7 days')
        AND collected_at < datetime('now', '-24 hours')
      GROUP BY category
    )
    SELECT
      c.category,
      c.current_mentions,
      ROUND(c.current_score, 2) AS current_score,
      COALESCE(p.previous_mentions, 0) AS previous_mentions,
      ROUND(
        (c.current_mentions * 1.0) /
        CASE WHEN p.previous_mentions > 0 THEN p.previous_mentions ELSE 1 END,
        2
      ) AS momentum
    FROM current_period c
    LEFT JOIN previous_period p ON p.category = c.category
    ORDER BY momentum DESC, current_score DESC
    LIMIT 8
  `).all();
  const rising = result.results || [];
  for (const row of rising) {
    try {
      const sample = await env.DB.prepare(`
        SELECT title, url FROM source_items
        WHERE category = ? AND collected_at >= datetime('now', '-24 hours')
        ORDER BY score DESC, collected_at DESC
        LIMIT 1
      `).bind(row.category).first();
      row.sample_title = sample?.title || null;
      row.sample_url = sample?.url || null;
    } catch {
      row.sample_title = null;
      row.sample_url = null;
    }
  }
  return { ok: true, period: "last 24 hours vs previous 6 days", rising };
}
__name(getRising, "getRising");

async function getTopic(env, query) {
  if (!env.DB) {
    return { ok: false, error: "D1 is not configured.", items: [] };
  }
  const like = `%${query}%`;
  const categoryMatch = query.trim().toLowerCase();
  const result = await env.DB.prepare(`
    SELECT source, title, description, url, category, score, published_at, collected_at
    FROM source_items
    WHERE category = ? OR title LIKE ? OR description LIKE ?
    ORDER BY score DESC, collected_at DESC
    LIMIT 20
  `).bind(categoryMatch, like, like).all();
  return { ok: true, query, items: result.results || [] };
}
__name(getTopic, "getTopic");

async function handleTelegramWebhook(request, env) {
  if (request.method !== "POST") {
    return new Response("Nantry Telegram webhook is active", { status: 200 });
  }
  if (env.TELEGRAM_WEBHOOK_SECRET) {
    const received = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
    if (received !== env.TELEGRAM_WEBHOOK_SECRET) {
      return new Response("Unauthorized", { status: 401 });
    }
  }
  let update;
  try {
    update = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }
  const message = update?.message;
  if (!message?.chat?.id) return new Response("OK");
  const chatId = message.chat.id;
  const text = typeof message.text === "string" ? message.text.trim() : "";
  if (env.DB) {
    try {
      await env.DB.prepare(`
        INSERT OR IGNORE INTO chats (chat_id, enabled, created_at) VALUES (?, 1, ?)
      `).bind(String(chatId), (/* @__PURE__ */ new Date()).toISOString()).run();
    } catch (error) {
      console.error("Chat registration failed", error);
    }
  }
  if (text === "/start" || text === "/help") {
    await sendTelegramMessage(env, chatId, [
      "📍 <b>Nantry</b>",
      "",
      "Nandi County public-interest intelligence.",
      "",
      "<b>Commands</b>",
      "/trends — top stories right now",
      "/rising — fastest-moving categories",
      "/topic football — search a topic or category",
      "/collect — collect fresh signals",
      "/status — system status",
      "",
      "Sources: Google News, Google Trends, YouTube."
    ].join("\n"));
    return new Response("OK");
  }
  if (text === "/status") {
    const status = await getStatus(env);
    await sendTelegramMessage(env, chatId, formatStatus(status));
    return new Response("OK");
  }
  if (text === "/collect") {
    const result = await collectSignals(env);
    await sendTelegramMessage(env, chatId, formatCollection(result));
    return new Response("OK");
  }
  if (text === "/trends") {
    const result = await getTrends(env);
    await sendTelegramMessage(env, chatId, formatTrends(result));
    return new Response("OK");
  }
  if (text === "/rising") {
    const result = await getRising(env);
    await sendTelegramMessage(env, chatId, formatRising(result));
    return new Response("OK");
  }
  if (text.toLowerCase().startsWith("/topic")) {
    const query = text.replace(/^\/topic\s*/i, "").trim();
    if (!query) {
      await sendTelegramMessage(env, chatId, "Use <b>/topic football</b> or <b>/topic crime</b>.");
      return new Response("OK");
    }
    const result = await getTopic(env, query);
    await sendTelegramMessage(env, chatId, formatTopic(result));
    return new Response("OK");
  }
  if (text.toLowerCase().startsWith("/broadcast")) {
    const isOwner = env.MY_CHAT_ID && String(chatId) === String(env.MY_CHAT_ID);
    if (!isOwner) {
      return new Response("OK");
    }
    const payload = text.replace(/^\/broadcast\s*/i, "").trim();
    if (!payload) {
      await sendTelegramMessage(env, chatId, "Use <b>/broadcast your message</b>.");
      return new Response("OK");
    }
    const result = await broadcastMessage(env, payload);
    await sendTelegramMessage(env, chatId, `📣 Broadcast sent to ${result.sent}/${result.total} chats.`);
    return new Response("OK");
  }
  await sendTelegramMessage(env, chatId, "Unknown command. Send /help.");
  return new Response("OK");
}
__name(handleTelegramWebhook, "handleTelegramWebhook");

async function broadcastMessage(env, text) {
  if (!env.DB) return { sent: 0, total: 0 };
  const result = await env.DB.prepare(`SELECT chat_id FROM chats WHERE enabled = 1`).all();
  const chats = result.results || [];
  let sent = 0;
  for (const row of chats) {
    try {
      await sendTelegramMessage(env, row.chat_id, `📣 <b>Nantry</b>\n\n${escapeHTML(text)}`);
      sent++;
    } catch (error) {
      console.error(`Broadcast to ${row.chat_id} failed`, error);
    }
  }
  return { sent, total: chats.length };
}
__name(broadcastMessage, "broadcastMessage");

async function sendTelegramMessage(env, chatId, text, retries = 2) {
  if (!env.TELEGRAM_BOT_TOKEN) {
    console.error("TELEGRAM_BOT_TOKEN is missing");
    return;
  }
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true
        })
      });
      if (response.ok) return;
      const body = await response.text();
      if (attempt === retries) {
        console.error("Telegram API error:", body);
      }
    } catch (error) {
      if (attempt === retries) {
        console.error("Telegram send failed:", error.message);
      }
    }
    await sleep(300 * (attempt + 1));
  }
}
__name(sendTelegramMessage, "sendTelegramMessage");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
__name(sleep, "sleep");

// ---- Formatting ----
// Links are rendered as short HTML anchors instead of raw pasted URLs,
// which is what made messages sprawl into unreadable blue blocks.

function linkTag(url, label = "Read more →") {
  if (!url) return "";
  return `<a href="${escapeAttr(url)}">${label}</a>`;
}
__name(linkTag, "linkTag");

function categoryTag(category) {
  if (!category || category === "general") return "";
  return ` · ${escapeHTML(category)}`;
}
__name(categoryTag, "categoryTag");

function formatStatus(status) {
  const lines = [
    "📊 <b>Nantry status</b>",
    "",
    `Telegram: ${status.telegram_configured ? "✅" : "❌"}`,
    `D1: ${status.d1_configured ? "✅" : "❌"}`,
    `YouTube: ${status.youtube_configured ? "✅" : "⚠️ optional"}`,
    `Google Trends: ${status.google_trends_configured ? "✅ custom" : "✅ default Kenya feed"}`,
    `Owner chat set: ${status.my_chat_id_configured ? "✅" : "⚠️ not set"}`
  ];
  if (status.last_run) {
    lines.push("", `Last collection: ${status.last_run.started_at || "—"}`);
    lines.push(`Fetched: ${status.last_run.fetched ?? "—"} · Inserted: ${status.last_run.inserted ?? "—"} · Errors: ${status.last_run.errors ?? 0}`);
  }
  if (typeof status.total_items === "number") {
    lines.push("", `Total stored items: ${status.total_items}`);
    lines.push(`Items in last 24h: ${status.items_last_24h}`);
  }
  if (typeof status.subscriber_count === "number") {
    lines.push(`Subscribers: ${status.subscriber_count}`);
  }
  return lines.join("\n");
}
__name(formatStatus, "formatStatus");

function formatCollection(result) {
  if (result.skipped) {
    return ["⏱ <b>Nantry</b>", "", "Collection was skipped.", "", escapeHTML(result.reason)].join("\n");
  }
  const lines = [
    "🔎 <b>Nantry collection</b>",
    "",
    `Fetched: <b>${result.fetched}</b>`,
    `New records: <b>${result.inserted}</b>`
  ];
  if (typeof result.filtered_out === "number" && result.filtered_out > 0) {
    lines.push(`Filtered as off-topic: ${result.filtered_out}`);
  }
  lines.push(
    "",
    `Google News: ${result.sources.google_news}`,
    `Google Trends: ${result.sources.google_trends}`,
    `YouTube: ${result.sources.youtube}`,
    `YouTube Trending: ${result.sources.youtube_trending}`,
    "",
    result.errors.length ? `⚠️ Errors: ${result.errors.length}` : "✅ Sources healthy"
  );
  return lines.join("\n");
}
__name(formatCollection, "formatCollection");

function formatTrends(result) {
  if (!result.ok) return `⚠️ ${escapeHTML(result.error)}`;
  const totalStories = result.groups.reduce((sum, g) => sum + g.stories.length, 0);
  if (!totalStories) {
    return ["📊 <b>Nantry trends</b>", "", "No data yet.", "", "Run /collect first."].join("\n");
  }
  const sections = result.groups.map((group) => {
    if (!group.stories.length) {
      return `<b>${escapeHTML(group.label)}</b>\nNo signals yet.`;
    }
    const lines = group.stories.map((item, index) => {
      const headline = `${index + 1}. <b>${escapeHTML(item.title)}</b>${categoryTag(item.category)}`;
      const link = item.url ? `\n   ${linkTag(item.url)}` : "";
      return headline + link;
    });
    return [`<b>${escapeHTML(group.label)}</b>`, ...lines].join("\n");
  });
  return ["🔥 <b>Nantry trends</b>", "", "Top stories, last 7 days:", "", ...sections].join("\n\n");
}
__name(formatTrends, "formatTrends");

function formatRising(result) {
  if (!result.ok) return `⚠️ ${escapeHTML(result.error)}`;
  if (!result.rising.length) {
    return ["📈 <b>Nantry rising</b>", "", "No recent signals yet."].join("\n");
  }
  return [
    "📈 <b>Nantry rising</b>",
    "",
    "Fastest-moving categories, last 24h vs prior week:",
    "",
    ...result.rising.slice(0, 8).map((item, index) => {
      const header = `${index + 1}. <b>${escapeHTML(item.category)}</b> — ${item.current_mentions} signals (${item.momentum}x)`;
      const sample = item.sample_title
        ? `\n   ↳ ${escapeHTML(item.sample_title)}${item.sample_url ? ` · ${linkTag(item.sample_url)}` : ""}`
        : "";
      return header + sample;
    })
  ].join("\n\n");
}
__name(formatRising, "formatRising");

function formatTopic(result) {
  if (!result.ok) return `⚠️ ${escapeHTML(result.error)}`;
  if (!result.items.length) {
    return ["🔎 <b>Nantry topic</b>", "", "No matching signals found."].join("\n");
  }
  return [
    `🔎 <b>${escapeHTML(result.query)}</b>`,
    "",
    ...result.items.slice(0, 10).map((item, index) => {
      const headline = `${index + 1}. <b>${escapeHTML(item.title)}</b>${categoryTag(item.category)}`;
      const link = item.url ? `\n   ${linkTag(item.url)}` : "";
      return headline + link;
    })
  ].join("\n\n");
}
__name(formatTopic, "formatTopic");

function escapeHTML(value) {
  return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
__name(escapeHTML, "escapeHTML");

function escapeAttr(value) {
  return escapeHTML(value).replace(/"/g, "&quot;");
}
__name(escapeAttr, "escapeAttr");

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" }
  });
}
__name(json, "json");

export {
  index_default as default
};

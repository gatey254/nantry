const VERSION = "2.0.0";

const GOOGLE_NEWS_QUERIES = [
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
  "Nandi entertainment"
];

const YOUTUBE_QUERIES = [
  "Nandi County Kenya",
  "Kapsabet Kenya",
  "Nandi Kenya"
];

const CATEGORY_KEYWORDS = {
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
    "deputy president"
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
    "money"
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
    "learning"
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
    "patients"
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
    "championship"
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
    "investigation"
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
    "crops"
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
  ]
};


export default {

  async fetch(request, env, ctx) {

    const url = new URL(request.url);

    try {

      if (url.pathname === "/") {
        return json({
          ok: true,
          service: "nantry",
          version: VERSION,
          status: "running",
          endpoints: [
            "/health",
            "/status",
            "/collect",
            "/trends",
            "/rising",
            "/topic?query=nandi"
          ],
          webhook: "/telegram/webhook"
        });
      }


      if (url.pathname === "/health") {

        return json({
          ok: true,
          service: "nantry",
          status: "healthy",
          time: new Date().toISOString()
        });

      }


      if (url.pathname === "/status") {

        return json({
          ok: true,
          service: "nantry",
          version: VERSION,
          telegram_configured: Boolean(
            env.TELEGRAM_BOT_TOKEN
          ),
          webhook_secret_configured: Boolean(
            env.TELEGRAM_WEBHOOK_SECRET
          ),
          d1_configured: Boolean(env.DB),
          youtube_configured: Boolean(
            env.YOUTUBE_API_KEY
          ),
          google_trends_configured: Boolean(
            env.GOOGLE_TRENDS_RSS_URL
          )
        });

      }


      if (url.pathname === "/collect") {

        const result =
          await collectSignals(env);

        return json(result);

      }


      if (url.pathname === "/trends") {

        const result =
          await getTrends(env);

        return json(result);

      }


      if (url.pathname === "/rising") {

        const result =
          await getRising(env);

        return json(result);

      }


      if (url.pathname === "/topic") {

        const query =
          url.searchParams.get("query");

        if (!query) {

          return json(
            {
              ok: false,
              error:
                "Missing query parameter. Example: /topic?query=football"
            },
            400
          );

        }

        return json(
          await getTopic(env, query)
        );

      }


      if (
        url.pathname ===
        "/telegram/webhook"
      ) {

        return handleTelegramWebhook(
          request,
          env
        );

      }


      return json(
        {
          ok: false,
          error: "Not found"
        },
        404
      );

    } catch (error) {

      console.error(error);

      return json(
        {
          ok: false,
          error: error.message || "Internal error"
        },
        500
      );

    }

  },


  async scheduled(controller, env, ctx) {

    ctx.waitUntil(
      collectSignals(env)
    );

  }

};


/* =========================================================
   COLLECTION
========================================================= */

async function collectSignals(env) {

  const startedAt =
    new Date().toISOString();

  const errors = [];

  const allItems = [];


  /*
   * Prevent manual / repeated collection
   * from hammering the sources.
   */

  if (env.DB) {

    try {

      const recent =
        await env.DB.prepare(`
          SELECT started_at
          FROM collection_runs
          ORDER BY id DESC
          LIMIT 1
        `).first();

      if (recent?.started_at) {

        const age =
          Date.now() -
          new Date(
            recent.started_at
          ).getTime();

        if (age < 5 * 60 * 1000) {

          return {
            ok: true,
            skipped: true,
            reason:
              "Collection ran less than 5 minutes ago"
          };

        }

      }

    } catch (error) {

      errors.push(
        `collection lock: ${error.message}`
      );

    }

  }


  let runId = null;


  if (env.DB) {

    try {

      const result =
        await env.DB.prepare(`
          INSERT INTO collection_runs
          (started_at)
          VALUES (?)
        `)
        .bind(startedAt)
        .run();

      runId =
        result.meta?.last_row_id || null;

    } catch (error) {

      errors.push(
        `run start: ${error.message}`
      );

    }

  }


  /*
   * GOOGLE NEWS
   */

  for (
    const query
    of GOOGLE_NEWS_QUERIES
  ) {

    try {

      const items =
        await fetchGoogleNews(query);

      for (const item of items) {

        item.source =
          "google_news";

        item.category =
          categorize(
            `${item.title} ${item.description}`
          );

        item.score =
          calculateScore(
            item,
            "google_news"
          );

        allItems.push(item);

      }

    } catch (error) {

      errors.push(
        `Google News "${query}": ${error.message}`
      );

    }

  }


  /*
   * GOOGLE TRENDS
   */

  const trendsUrl =
    env.GOOGLE_TRENDS_RSS_URL ||
    "https://trends.google.com/trending/rss?geo=KE";


  try {

    const items =
      await fetchRSS(
        trendsUrl
      );

    for (const item of items) {

      item.source =
        "google_trends";

      item.category =
        categorize(
          `${item.title} ${item.description}`
        );

      item.score =
        calculateScore(
          item,
          "google_trends"
        );

      allItems.push(item);

    }

  } catch (error) {

    errors.push(
      `Google Trends: ${error.message}`
    );

  }


  /*
   * YOUTUBE
   *
   * Optional. It only runs when
   * YOUTUBE_API_KEY exists.
   */

  if (env.YOUTUBE_API_KEY) {

    for (
      const query
      of YOUTUBE_QUERIES
    ) {

      try {

        const items =
          await fetchYouTube(
            env.YOUTUBE_API_KEY,
            query
          );

        for (const item of items) {

          item.source =
            "youtube";

          item.category =
            categorize(
              `${item.title} ${item.description}`
            );

          item.score =
            calculateScore(
              item,
              "youtube"
            );

          allItems.push(item);

        }

      } catch (error) {

        errors.push(
          `YouTube "${query}": ${error.message}`
        );

      }

    }

  }


  /*
   * STORE IN D1
   */

  let inserted = 0;


  if (
    env.DB &&
    allItems.length
  ) {

    for (
      const item
      of allItems
    ) {

      try {

        const externalId =
          item.external_id ||
          item.url ||
          item.title;


        const result =
          await env.DB.prepare(`
            INSERT OR IGNORE INTO source_items
            (
              source,
              external_id,
              title,
              description,
              url,
              category,
              score,
              published_at,
              collected_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `)
          .bind(
            item.source,
            externalId,
            item.title,
            item.description || "",
            item.url || null,
            item.category || "general",
            item.score || 1,
            item.published_at || null,
            startedAt
          )
          .run();


        inserted +=
          Number(
            result.meta?.changes || 0
          );

      } catch (error) {

        errors.push(
          `D1 insert: ${error.message}`
        );

      }

    }

  }


  if (
    env.DB &&
    runId
  ) {

    try {

      await env.DB.prepare(`
        UPDATE collection_runs
        SET
          finished_at = ?,
          fetched = ?,
          inserted = ?,
          errors = ?
        WHERE id = ?
      `)
      .bind(
        new Date().toISOString(),
        allItems.length,
        inserted,
        errors.length,
        runId
      )
      .run();

    } catch (error) {

      console.error(
        "Could not update collection run",
        error
      );

    }

  }


  return {

    ok:
      errors.length === 0,

    fetched:
      allItems.length,

    inserted,

    errors,

    sources: {

      google_news:
        allItems.filter(
          x =>
            x.source ===
            "google_news"
        ).length,

      google_trends:
        allItems.filter(
          x =>
            x.source ===
            "google_trends"
        ).length,

      youtube:
        allItems.filter(
          x =>
            x.source ===
            "youtube"
        ).length

    }

  };

}


/* =========================================================
   GOOGLE NEWS
========================================================= */

async function fetchGoogleNews(
  query
) {

  const url =
    `https://news.google.com/rss/search?q=${encodeURIComponent(
      query
    )}&hl=en-KE&gl=KE&ceid=KE:en`;


  return fetchRSS(url);

}


/* =========================================================
   GENERIC RSS
========================================================= */

async function fetchRSS(url) {

  const response =
    await fetch(
      url,
      {
        headers: {
          "User-Agent":
            "Nantry/2.0 (+https://nantry.wmwirotsi.workers.dev)"
        }
      }
    );


  if (!response.ok) {

    throw new Error(
      `HTTP ${response.status}`
    );

  }


  const xml =
    await response.text();


  return parseRSS(xml);

}


function parseRSS(xml) {

  const items = [];


  /*
   * RSS <item>
   */

  const blocks =
    xml.match(
      /<item[\s\S]*?<\/item>/gi
    ) || [];


  for (
    const block
    of blocks
  ) {

    const title =
      decodeXML(
        getTag(
          block,
          "title"
        )
      );


    if (!title) {

      continue;

    }


    const link =
      getTag(
        block,
        "link"
      );


    const description =
      decodeXML(
        getTag(
          block,
          "description"
        )
      );


    const published =
      getTag(
        block,
        "pubDate"
      ) ||
      getTag(
        block,
        "published"
      ) ||
      getTag(
        block,
        "updated"
      );


    const guid =
      getTag(
        block,
        "guid"
      ) ||
      link ||
      title;


    items.push({

      external_id:
        guid,

      title,

      description,

      url:
        link,

      published_at:
        published

    });

  }


  return items;

}


function getTag(
  text,
  tag
) {

  const regex =
    new RegExp(
      `<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`,
      "i"
    );


  const match =
    text.match(regex);


  return match
    ? match[1].trim()
    : "";

}


function decodeXML(
  value
) {

  return String(
    value || ""
  )

    .replace(
      /<!\[CDATA\[([\s\S]*?)\]\]>/g,
      "$1"
    )

    .replace(
      /<[^>]+>/g,
      " "
    )

    .replace(
      /&amp;/g,
      "&"
    )

    .replace(
      /&lt;/g,
      "<"
    )

    .replace(
      /&gt;/g,
      ">"
    )

    .replace(
      /&quot;/g,
      '"'
    )

    .replace(
      /&#39;/g,
      "'"
    )

    .replace(
      /&#x27;/g,
      "'"
    )

    .replace(
      /\s+/g,
      " "
    )

    .trim();

}


/* =========================================================
   YOUTUBE
========================================================= */

async function fetchYouTube(
  apiKey,
  query
) {

  const url =
    new URL(
      "https://www.googleapis.com/youtube/v3/search"
    );


  url.searchParams.set(
    "part",
    "snippet"
  );

  url.searchParams.set(
    "q",
    query
  );

  url.searchParams.set(
    "type",
    "video"
  );

  url.searchParams.set(
    "order",
    "date"
  );

  url.searchParams.set(
    "maxResults",
    "10"
  );

  url.searchParams.set(
    "regionCode",
    "KE"
  );

  url.searchParams.set(
    "relevanceLanguage",
    "en"
  );

  url.searchParams.set(
    "key",
    apiKey
  );


  const response =
    await fetch(url);


  if (!response.ok) {

    const body =
      await response.text();

    throw new Error(
      `HTTP ${response.status}: ${body.slice(
        0,
        200
      )}`
    );

  }


  const data =
    await response.json();


  return (
    data.items || []
  )
    .filter(
      item =>
        item.id?.videoId
    )
    .map(
      item => ({

        external_id:
          item.id.videoId,

        title:
          item.snippet?.title ||
          "Untitled",

        description:
          item.snippet?.description ||
          "",

        url:
          `https://www.youtube.com/watch?v=${item.id.videoId}`,

        published_at:
          item.snippet?.publishedAt ||
          null

      })
    );

}


/* =========================================================
   CATEGORIZATION
========================================================= */

function categorize(
  text
) {

  const value =
    String(
      text || ""
    )
      .toLowerCase();


  let bestCategory =
    "general";

  let bestScore =
    0;


  for (
    const [
      category,
      keywords
    ]
    of Object.entries(
      CATEGORY_KEYWORDS
    )
  ) {

    let score = 0;


    for (
      const keyword
      of keywords
    ) {

      if (
        value.includes(
          keyword
        )
      ) {

        score++;

      }

    }


    if (
      score >
      bestScore
    ) {

      bestScore =
        score;

      bestCategory =
        category;

    }

  }


  return bestCategory;

}


/* =========================================================
   SIGNAL SCORING
========================================================= */

function calculateScore(
  item,
  source
) {

  let score = 1;


  if (
    source ===
    "google_trends"
  ) {

    score += 4;

  }


  if (
    source ===
    "youtube"
  ) {

    score += 2;

  }


  if (
    source ===
    "google_news"
  ) {

    score += 1;

  }


  if (
    item.published_at
  ) {

    const time =
      new Date(
        item.published_at
      ).getTime();


    if (
      Number.isFinite(
        time
      )
    ) {

      const age =
        Date.now() -
        time;


      if (
        age <
        24 * 60 * 60 * 1000
      ) {

        score += 3;

      } else if (
        age <
        72 * 60 * 60 * 1000
      ) {

        score += 2;

      } else if (
        age <
        7 * 24 * 60 * 60 * 1000
      ) {

        score += 1;

      }

    }

  }


  return score;

}


/* =========================================================
   TREND REPORT
========================================================= */

async function getTrends(
  env
) {

  if (!env.DB) {

    return {

      ok: false,

      error:
        "D1 is not configured.",

      trends: []

    };

  }


  const result =
    await env.DB.prepare(`
      SELECT
        category,
        COUNT(*) AS mentions,
        ROUND(
          SUM(score),
          2
        ) AS signal_score,
        MAX(collected_at) AS latest
      FROM source_items
      WHERE collected_at >= datetime(
        'now',
        '-7 days'
      )
      GROUP BY category
      ORDER BY signal_score DESC
      LIMIT 20
    `)
    .all();


  return {

    ok: true,

    period:
      "last 7 days",

    trends:
      result.results || []

  };

}


/* =========================================================
   RISING TOPICS
========================================================= */

async function getRising(
  env
) {

  if (!env.DB) {

    return {

      ok: false,

      error:
        "D1 is not configured.",

      rising: []

    };

  }


  const result =
    await env.DB.prepare(`
      WITH current_period AS (

        SELECT
          category,
          COUNT(*) AS current_mentions,
          SUM(score) AS current_score

        FROM source_items

        WHERE collected_at >= datetime(
          'now',
          '-24 hours'
        )

        GROUP BY category

      ),

      previous_period AS (

        SELECT
          category,
          COUNT(*) AS previous_mentions,
          SUM(score) AS previous_score

        FROM source_items

        WHERE
          collected_at >= datetime(
            'now',
            '-7 days'
          )

          AND collected_at <
            datetime(
              'now',
              '-24 hours'
            )

        GROUP BY category

      )

      SELECT

        c.category,

        c.current_mentions,

        ROUND(
          c.current_score,
          2
        ) AS current_score,

        COALESCE(
          p.previous_mentions,
          0
        ) AS previous_mentions,

        ROUND(
          (
            c.current_mentions * 1.0
          ) /
          CASE
            WHEN p.previous_mentions > 0
            THEN p.previous_mentions
            ELSE 1
          END,
          2
        ) AS momentum

      FROM current_period c

      LEFT JOIN previous_period p
        ON p.category =
           c.category

      ORDER BY momentum DESC,
               current_score DESC

      LIMIT 20
    `)
    .all();


  return {

    ok: true,

    period:
      "last 24 hours vs previous 6 days",

    rising:
      result.results || []

  };

}


/* =========================================================
   TOPIC SEARCH
========================================================= */

async function getTopic(
  env,
  query
) {

  if (!env.DB) {

    return {

      ok: false,

      error:
        "D1 is not configured.",

      items: []

    };

  }


  const like =
    `%${query}%`;


  const result =
    await env.DB.prepare(`
      SELECT
        source,
        title,
        description,
        url,
        category,
        score,
        published_at,
        collected_at
      FROM source_items
      WHERE
        title LIKE ?
        OR description LIKE ?
      ORDER BY
        score DESC,
        collected_at DESC
      LIMIT 20
    `)
    .bind(
      like,
      like
    )
    .all();


  return {

    ok: true,

    query,

    items:
      result.results || []

  };

}


/* =========================================================
   TELEGRAM
========================================================= */

async function handleTelegramWebhook(
  request,
  env
) {

  if (
    request.method !==
    "POST"
  ) {

    return new Response(
      "Nantry Telegram webhook is active",
      {
        status: 200
      }
    );

  }


  /*
   * Verify Telegram's secret
   */

  if (
    env.TELEGRAM_WEBHOOK_SECRET
  ) {

    const received =
      request.headers.get(
        "X-Telegram-Bot-Api-Secret-Token"
      );


    if (
      received !==
      env.TELEGRAM_WEBHOOK_SECRET
    ) {

      return new Response(
        "Unauthorized",
        {
          status: 401
        }
      );

    }

  }


  let update;


  try {

    update =
      await request.json();

  } catch {

    return new Response(
      "Invalid JSON",
      {
        status: 400
      }
    );

  }


  const message =
    update?.message;


  if (
    !message?.chat?.id
  ) {

    return new Response(
      "OK"
    );

  }


  const chatId =
    message.chat.id;


  const text =
    typeof message.text ===
    "string"

      ? message.text.trim()

      : "";


  /*
   * Register chat
   */

  if (env.DB) {

    try {

      await env.DB.prepare(`
        INSERT OR IGNORE INTO chats
        (
          chat_id,
          enabled,
          created_at
        )
        VALUES (?, 1, ?)
      `)
      .bind(
        String(chatId),
        new Date().toISOString()
      )
      .run();

    } catch (error) {

      console.error(
        "Chat registration failed",
        error
      );

    }

  }


  /*
   * /start
   */

  if (
    text ===
      "/start" ||
    text ===
      "/help"
  ) {

    await sendTelegramMessage(
      env,
      chatId,
      [
        "📍 <b>NANTRY</b>",
        "",
        "Nandi County public-interest intelligence.",
        "",
        "<b>Commands</b>",
        "",
        "/trends — biggest topics",
        "/rising — fastest-rising categories",
        "/topic football — search a topic",
        "/collect — collect fresh signals",
        "/status — system status",
        "",
        "Nantry uses public signals from Google News, Google Trends and YouTube."
      ].join("\n")
    );

    return new Response(
      "OK"
    );

  }


  /*
   * /status
   */

  if (
    text ===
    "/status"
  ) {

    await sendTelegramMessage(
      env,
      chatId,
      [
        "📊 <b>NANTRY STATUS</b>",
        "",
        `Worker: ${env.DB ? "✅" : "⚠️"}`,
        `D1: ${env.DB ? "✅" : "❌"}`,
        `Telegram: ${
          env.TELEGRAM_BOT_TOKEN
            ? "✅"
            : "❌"
        }`,
        `YouTube: ${
          env.YOUTUBE_API_KEY
            ? "✅"
            : "⚠️ optional"
        }`,
        `Google Trends: ${
          env.GOOGLE_TRENDS_RSS_URL
            ? "✅ custom"
            : "✅ default Kenya feed"
        }`
      ].join("\n")
    );

    return new Response(
      "OK"
    );

  }


  /*
   * /collect
   */

  if (
    text ===
    "/collect"
  ) {

    const result =
      await collectSignals(
        env
      );


    await sendTelegramMessage(
      env,
      chatId,
      formatCollection(
        result
      )
    );


    return new Response(
      "OK"
    );

  }


  /*
   * /trends
   */

  if (
    text ===
    "/trends"
  ) {

    const result =
      await getTrends(
        env
      );


    await sendTelegramMessage(
      env,
      chatId,
      formatTrends(
        result
      )
    );


    return new Response(
      "OK"
    );

  }


  /*
   * /rising
   */

  if (
    text ===
    "/rising"
  ) {

    const result =
      await getRising(
        env
      );


    await sendTelegramMessage(
      env,
      chatId,
      formatRising(
        result
      )
    );


    return new Response(
      "OK"
    );

  }


  /*
   * /topic
   */

  if (
    text
      .toLowerCase()
      .startsWith(
        "/topic"
      )
  ) {

    const query =
      text
        .replace(
          /^\/topic\s*/i,
          ""
        )
        .trim();


    if (!query) {

      await sendTelegramMessage(
        env,
        chatId,
        "Use <b>/topic football</b> or <b>/topic schools</b>."
      );

      return new Response(
        "OK"
      );

    }


    const result =
      await getTopic(
        env,
        query
      );


    await sendTelegramMessage(
      env,
      chatId,
      formatTopic(
        result
      )
    );


    return new Response(
      "OK"
    );

  }


  await sendTelegramMessage(
    env,
    chatId,
    "Unknown command. Send /help."
  );


  return new Response(
    "OK"
  );

}


/* =========================================================
   TELEGRAM SEND
========================================================= */

async function sendTelegramMessage(
  env,
  chatId,
  text
) {

  if (
    !env.TELEGRAM_BOT_TOKEN
  ) {

    console.error(
      "TELEGRAM_BOT_TOKEN is missing"
    );

    return;

  }


  const response =
    await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify({
            chat_id:
              chatId,

            text,

            parse_mode:
              "HTML",

            disable_web_page_preview:
              true
          })
      }
    );


  if (
    !response.ok
  ) {

    console.error(
      "Telegram API error:",
      await response.text()
    );

  }

}


/* =========================================================
   TELEGRAM FORMATTING
========================================================= */

function formatCollection(
  result
) {

  if (
    result.skipped
  ) {

    return [
      "⏱ <b>NANTRY</b>",
      "",
      "Collection was skipped.",
      "",
      escapeHTML(
        result.reason
      )
    ].join("\n");

  }


  return [

    "🔎 <b>NANTRY COLLECTION</b>",

    "",

    `Fetched: <b>${result.fetched}</b>`,

    `New records: <b>${result.inserted}</b>`,

    "",

    `Google News: ${result.sources.google_news}`,

    `Google Trends: ${result.sources.google_trends}`,

    `YouTube: ${result.sources.youtube}`,

    "",

    result.errors.length
      ? `⚠️ Errors: ${result.errors.length}`
      : "✅ Sources healthy"

  ].join("\n");

}


function formatTrends(
  result
) {

  if (
    !result.ok
  ) {

    return `⚠️ ${escapeHTML(result.error)}`;

  }


  if (
    !result.trends.length
  ) {

    return [
      "📊 <b>NANTRY TRENDS</b>",
      "",
      "No data yet.",
      "",
      "Run /collect first."
    ].join("\n");

  }


  return [

    "🔥 <b>NANTRY TRENDS</b>",

    "",
    "Top categories over the last 7 days:",

    "",

    ...result.trends
      .slice(0, 10)
      .map(
        (item, index) =>
          `${index + 1}. <b>${escapeHTML(
            item.category
          )}</b> — ${item.mentions} signals`
      )

  ].join("\n");

}


function formatRising(
  result
) {

  if (
    !result.ok
  ) {

    return `⚠️ ${escapeHTML(result.error)}`;

  }


  if (
    !result.rising.length
  ) {

    return [
      "📈 <b>NANTRY RISING</b>",
      "",
      "No recent signals yet."
    ].join("\n");

  }


  return [

    "📈 <b>NANTRY RISING</b>",

    "",

    "Fastest-moving categories:",

    "",

    ...result.rising
      .slice(0, 10)
      .map(
        (item, index) =>
          `${index + 1}. <b>${escapeHTML(
            item.category
          )}</b> — ${item.current_mentions} signals`
      )

  ].join("\n");

}


function formatTopic(
  result
) {

  if (
    !result.ok
  ) {

    return `⚠️ ${escapeHTML(result.error)}`;

  }


  if (
    !result.items.length
  ) {

    return [
      "🔎 <b>NANTRY TOPIC</b>",
      "",
      "No matching signals found."
    ].join("\n");

  }


  return [

    `🔎 <b>${escapeHTML(
      result.query
    )}</b>`,

    "",

    ...result.items
      .slice(0, 10)
      .map(
        (item, index) =>
          `${index + 1}. ${escapeHTML(
            item.title
          )}\n${item.url || ""}`
      )

  ].join("\n\n");

}


function escapeHTML(
  value
) {

  return String(
    value || ""
  )

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    );

}


/* =========================================================
   RESPONSE HELPER
========================================================= */

function json(
  data,
  status = 200
) {

  return new Response(
    JSON.stringify(
      data,
      null,
      2
    ),
    {
      status,

      headers: {
        "Content-Type":
          "application/json; charset=utf-8"
      }
    }
  );

}

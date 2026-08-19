const VERSION = "1.0.0";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // --------------------------------------------------
    // HOME
    // --------------------------------------------------

    if (url.pathname === "/") {
      return Response.json({
        ok: true,
        service: "nantry",
        version: VERSION,
        status: "running",
        webhook: "/telegram/webhook"
      });
    }

    // --------------------------------------------------
    // HEALTH
    // --------------------------------------------------

    if (url.pathname === "/health") {
      return Response.json({
        ok: true,
        service: "nantry",
        status: "healthy",
        time: new Date().toISOString()
      });
    }

    // --------------------------------------------------
    // TELEGRAM WEBHOOK
    // --------------------------------------------------

    if (url.pathname === "/telegram/webhook") {
      return handleTelegramWebhook(request, env);
    }

    // --------------------------------------------------
    // STATUS
    // --------------------------------------------------

    if (url.pathname === "/status") {
      return Response.json({
        ok: true,
        service: "nantry",
        version: VERSION,
        telegram_configured:
          !!env.TELEGRAM_BOT_TOKEN,
        webhook_secret_configured:
          !!env.TELEGRAM_WEBHOOK_SECRET,
        database_configured:
          !!env.DB
      });
    }

    return Response.json(
      {
        ok: false,
        error: "Not found"
      },
      {
        status: 404
      }
    );
  },

  async scheduled(controller, env, ctx) {
    console.log(
      "Nantry scheduled job:",
      new Date().toISOString()
    );
  }
};


// ======================================================
// TELEGRAM WEBHOOK
// ======================================================

async function handleTelegramWebhook(request, env) {

  // Telegram sends POST requests.
  if (request.method !== "POST") {
    return new Response(
      "Nantry Telegram webhook is active",
      {
        status: 200
      }
    );
  }

  // ----------------------------------------------------
  // SECURITY
  // ----------------------------------------------------

  if (env.TELEGRAM_WEBHOOK_SECRET) {
    const receivedSecret =
      request.headers.get(
        "X-Telegram-Bot-Api-Secret-Token"
      );

    if (
      receivedSecret !==
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

  // ----------------------------------------------------
  // READ TELEGRAM UPDATE
  // ----------------------------------------------------

  let update;

  try {
    update = await request.json();
  } catch {
    return new Response(
      "Invalid JSON",
      {
        status: 400
      }
    );
  }

  console.log(
    "Telegram update:",
    JSON.stringify(update)
  );

  const message = update?.message;

  // Telegram can send updates that are not messages.
  if (!message) {
    return new Response(
      "OK",
      {
        status: 200
      }
    );
  }

  const chatId =
    message?.chat?.id;

  if (!chatId) {
    return new Response(
      "OK",
      {
        status: 200
      }
    );
  }

  const text =
    typeof message.text === "string"
      ? message.text.trim()
      : "";

  // ----------------------------------------------------
  // COMMANDS
  // ----------------------------------------------------

  if (
    text === "/start" ||
    text === "/help"
  ) {
    await sendTelegramMessage(
      env,
      chatId,
      [
        "📍 <b>NANTRY</b>",
        "",
        "Nandi County trend intelligence.",
        "",
        "Available commands:",
        "",
        "/trends — current trends",
        "/rising — rising topics",
        "/collect — collect signals",
        "/status — system status",
        "/help — show this menu"
      ].join("\n")
    );

    return new Response(
      "OK",
      {
        status: 200
      }
    );
  }

  if (text === "/status") {
    await sendTelegramMessage(
      env,
      chatId,
      [
        "📊 <b>NANTRY STATUS</b>",
        "",
        `Worker: ${env ? "✅" : "❌"}`,
        `Telegram: ${
          env.TELEGRAM_BOT_TOKEN
            ? "✅ configured"
            : "❌ missing"
        }`,
        `Webhook security: ${
          env.TELEGRAM_WEBHOOK_SECRET
            ? "✅ configured"
            : "⚠️ not configured"
        }`,
        `D1: ${
          env.DB
            ? "✅ configured"
            : "⚠️ not configured yet"
        }`
      ].join("\n")
    );

    return new Response(
      "OK",
      {
        status: 200
      }
    );
  }

  if (text === "/trends") {
    await sendTelegramMessage(
      env,
      chatId,
      [
        "🔥 <b>NANTRY TRENDS</b>",
        "",
        "The trend engine is being connected.",
        "",
        "Sources will include:",
        "• Google News",
        "• Google Trends signals",
        "• YouTube",
        "• Nandi/Kapsabet local signals",
        "",
        "D1 storage is the next configuration step."
      ].join("\n")
    );

    return new Response(
      "OK",
      {
        status: 200
      }
    );
  }

  if (text === "/rising") {
    await sendTelegramMessage(
      env,
      chatId,
      [
        "📈 <b>NANTRY RISING</b>",
        "",
        "The trend engine is being connected.",
        "",
        "Once D1 is connected, Nantry will rank topics by:",
        "• volume",
        "• velocity",
        "• source diversity",
        "• freshness"
      ].join("\n")
    );

    return new Response(
      "OK",
      {
        status: 200
      }
    );
  }

  if (text === "/collect") {
    await sendTelegramMessage(
      env,
      chatId,
      [
        "🔎 <b>NANTRY COLLECTION</b>",
        "",
        "Collection engine is ready.",
        "",
        "D1 storage and external source keys are the next configuration step."
      ].join("\n")
    );

    return new Response(
      "OK",
      {
        status: 200
      }
    );
  }

  // ----------------------------------------------------
  // UNKNOWN COMMAND
  // ----------------------------------------------------

  await sendTelegramMessage(
    env,
    chatId,
    "Unknown command. Send /help."
  );

  return new Response(
    "OK",
    {
      status: 200
    }
  );
}


// ======================================================
// TELEGRAM API
// ======================================================

async function sendTelegramMessage(
  env,
  chatId,
  text
) {
  if (!env.TELEGRAM_BOT_TOKEN) {
    console.error(
      "TELEGRAM_BOT_TOKEN is missing"
    );

    return;
  }

  const response = await fetch(
    `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json"
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true
      })
    }
  );

  if (!response.ok) {
    console.error(
      "Telegram API error:",
      await response.text()
    );
  }
}

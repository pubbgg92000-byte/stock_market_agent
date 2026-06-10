export async function sendTelegramMessage(text: string): Promise<{ ok: boolean; detail: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return { ok: false, detail: "Telegram is not configured." };
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true
    })
  });

  if (!response.ok) {
    return { ok: false, detail: `Telegram returned ${response.status}.` };
  }

  return { ok: true, detail: "Telegram message sent." };
}

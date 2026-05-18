/**
 * Telegram Bot API — sendMessage utility
 *
 * Security:
 * - TELEGRAM_BOT_TOKEN is embedded in the fetch URL — NEVER log the URL
 * - Credentials come only from process.env (.env.local) — never from client input
 *
 * Error policy (D-16, D-17):
 * - Missing env vars: return early, void (D-11)
 * - API failure (non-ok response): console.error status + body, no throw
 * - Network failure (fetch rejects): console.error, no throw
 */

export async function sendTelegramMessage(text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  // D-11: silently skip if not configured — app continues working without Telegram
  if (!token || !chatId) {
    return false
  }

  // SECURITY: URL contains the token — construct it but NEVER log it
  const url = `https://api.telegram.org/bot${token}/sendMessage`

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',  // HTML is safer than MarkdownV2 for Turkish text (no escaping needed)
      }),
    })

    if (!res.ok) {
      // D-16: log error but do not throw — log only status + body, NOT the URL
      const body = await res.text()
      console.error('[telegram] sendMessage failed:', res.status, body)
      return false
    }
    return true
  } catch (err) {
    // D-16: network errors (DNS failure, timeout, etc.) are also silent
    console.error('[telegram] sendMessage network error:', String(err))
    return false
  }
}

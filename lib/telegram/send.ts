/**
 * Telegram Message Sender — stub for parallel Wave 1 agent worktree
 *
 * NOTE: This is a minimal stub created for test isolation in this worktree.
 * The real implementation is created by Plan 25-01 (parallel Wave 1 agent).
 * After Wave 1 merge, this file will be replaced by the real implementation.
 *
 * Real implementation in Plan 25-01:
 * - Reads TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID from env
 * - Returns early (no throw) if either is missing
 * - POSTs to Telegram Bot API with HTML parse_mode
 * - Wraps all errors in try/catch (no throw on failure)
 */

/**
 * Sends a message via the Telegram Bot API.
 * Returns void on success or silently on error (D-16).
 */
export async function sendTelegramMessage(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!token || !chatId) {
    return
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    })

    if (!response.ok) {
      const body = await response.text()
      console.error('[telegram] API error:', response.status, body)
    }
  } catch (err) {
    console.error('[telegram] fetch failed:', String(err))
  }
}

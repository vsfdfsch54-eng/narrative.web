/**
 * Alerting system for critical errors
 * Sends alerts to Slack webhook for production incidents
 */

/**
 * Send a Slack alert for critical errors
 */
export async function sendSlackAlert(
  message: string,
  severity: 'error' | 'warn' | 'info' = 'error',
  context?: Record<string, any>
) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  
  if (!webhookUrl) {
    // No webhook configured - log instead
    console.error(`[ALERT ${severity.toUpperCase()}] ${message}`, context)
    return
  }

  try {
    const payload = {
      text: `[${severity.toUpperCase()}] ${message}`,
      attachments: context ? [
        {
          color: severity === 'error' ? 'danger' : severity === 'warn' ? 'warning' : 'good',
          fields: Object.entries(context).map(([key, value]) => ({
            title: key,
            value: String(value),
            short: true,
          })),
        },
      ] : [],
    }

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    // Fail silently - don't break the app if Slack is down
    console.error('[Alerts] Failed to send Slack alert:', error)
  }
}

/**
 * Send alert for matchmaking failures
 */
export async function alertMatchmakingFailure(error: string, context?: Record<string, any>) {
  await sendSlackAlert(
    `Matchmaking system failure: ${error}`,
    'error',
    {
      service: 'matchmaking',
      timestamp: new Date().toISOString(),
      ...context,
    }
  )
}

/**
 * Send alert for database connection issues
 */
export async function alertDatabaseError(error: string, context?: Record<string, any>) {
  await sendSlackAlert(
    `Database error: ${error}`,
    'error',
    {
      service: 'database',
      timestamp: new Date().toISOString(),
      ...context,
    }
  )
}


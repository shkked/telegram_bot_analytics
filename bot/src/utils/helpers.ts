import { Context } from "telegraf"

export function getChatId(ctx: Context): number | null {
	return ctx.chat?.id || null
}

export function getUserId(ctx: Context): number | null {
	const message = ctx.message
	if (!message || !("from" in message)) {
		return null
	}
	return message.from?.id || null
}

export function formatUsername(
	username?: string,
	firstName?: string,
	lastName?: string,
): string {
	if (username) {
		return `@${username}`
	}
	const parts = []
	if (firstName) parts.push(firstName)
	if (lastName) parts.push(lastName)
	return parts.join(" ") || "Unknown"
}

export function getPeriodText(daysAgo?: number): string {
	if (daysAgo === undefined) return "All Time"
	if (daysAgo === 0) return "Today"
	if (daysAgo === 7) return "This Week"
	if (daysAgo === 30) return "This Month"
	return `Last ${daysAgo} days`
}

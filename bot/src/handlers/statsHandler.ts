import { Context } from "telegraf"
import { StatsService } from "../services/StatsService"

const TIME_PERIODS: { [key: string]: number | undefined } = {
	today: 0,
	week: 7,
	month: 30,
	all: undefined,
}

export async function onStatsCommand(ctx: Context): Promise<void> {
	try {
		if (!ctx.chat) {
			await ctx.reply("This command only works in group chats")
			return
		}

		const chatId = ctx.chat.id

		// Get stats for all time
		const stats = await StatsService.getTopUsers(chatId, 10)

		let message = "📊 <b>Chat Statistics (All Time)</b>\n\n"
		message += "<b>Top 10 Users:</b>\n"

		stats.stats.forEach((stat, index) => {
			const name = stat.username
				? `@${stat.username}`
				: stat.first_name || "Unknown"
			message += `${index + 1}. ${name} - <b>${
				stat.message_count
			}</b> messages\n`
		})

		message += `\n<i>Total: ${stats.totalMessages} messages from ${stats.totalUsers} users</i>`

		// Create inline keyboard for filtering
		const keyboard = {
			inline_keyboard: [
				[
					{ text: "📈 Today", callback_data: "stats_today" },
					{ text: "📊 Week", callback_data: "stats_week" },
				],
				[
					{ text: "📅 Month", callback_data: "stats_month" },
					{ text: "🔄 All Time", callback_data: "stats_all" },
				],
			],
		}

		await ctx.reply(message, {
			parse_mode: "HTML",
			reply_markup: keyboard,
		})
	} catch (error) {
		console.error("Error in stats command:", error)
		await ctx.reply("Failed to get statistics")
	}
}

export async function onStatsCallback(ctx: Context): Promise<void> {
	try {
		const data = (ctx.callbackQuery as any)?.data || ""
		const period = data.replace("stats_", "")
		const daysAgo = TIME_PERIODS[period]

		if (!ctx.chat) {
			await ctx.answerCbQuery("Failed to determine chat", { show_alert: true })
			return
		}

		const stats = await StatsService.getTopUsers(ctx.chat.id, 10, daysAgo)

		let periodText = ""
		if (period === "today") periodText = "Today"
		else if (period === "week") periodText = "This Week"
		else if (period === "month") periodText = "This Month"
		else periodText = "All Time"

		let message = `📊 <b>Chat Statistics (${periodText})</b>\n\n`
		message += "<b>Top 10 Users:</b>\n"

		stats.stats.forEach((stat, index) => {
			const name = stat.username
				? `@${stat.username}`
				: stat.first_name || "Unknown"
			message += `${index + 1}. ${name} - <b>${
				stat.message_count
			}</b> messages\n`
		})

		message += `\n<i>Total: ${stats.totalMessages} messages from ${stats.totalUsers} users</i>`

		// Create inline keyboard for filtering
		const keyboard = {
			inline_keyboard: [
				[
					{ text: "📈 Today", callback_data: "stats_today" },
					{ text: "📊 Week", callback_data: "stats_week" },
				],
				[
					{ text: "📅 Month", callback_data: "stats_month" },
					{ text: "🔄 All Time", callback_data: "stats_all" },
				],
			],
		}

		if (ctx.callbackQuery) {
			await ctx.editMessageText(message, {
				parse_mode: "HTML",
				reply_markup: keyboard,
			})
			await ctx.answerCbQuery()
		}
	} catch (error) {
		console.error("Error in stats callback:", error)
		await ctx.answerCbQuery("Failed to get statistics", { show_alert: true })
	}
}

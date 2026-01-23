import { Context } from "telegraf"
import { StatsService } from "../services/StatsService"

const TIME_PERIODS: { [key: string]: number | undefined } = {
	today: 0,
	week: 7,
	month: 30,
	all: undefined,
}

// TODO Поменять any на Context из telegraf
export async function onStatsCommand(ctx: any): Promise<void> {
	try {
		if (!ctx.chat) {
			await ctx.reply("Это команда работает только в групповых чатах")
			return
		}

		const chatId = ctx.update.message.chat.id

		// Get stats for all time
		// TODO решить проблему с переводом на английский и необнолвением данных. Хотя в бд всё ок
		const stats = await StatsService.getTopUsers(chatId, 10)
		let message = "📊 <b>Статистика чата за всё время</b>\n\n"
		message += "<b>Топ 10 пользователей:</b>\n"

		stats.stats.forEach((stat, index) => {
			const name = stat.username
				? `@${stat.username}`
				: stat.first_name || "Неизвестно"
			message += `${index + 1}. ${name} - <b>${
				stat.message_count
			}</b> сообщений\n`
		})

		message += `\n<i>Всего: ${stats.totalMessages} сообщений от ${stats.totalUsers} пользователей</i>`

		// Create inline keyboard for filtering
		const keyboard = {
			inline_keyboard: [
				[
					{ text: "📈 Сегодня", callback_data: "stats_today" },
					{ text: "📊 За неделю", callback_data: "stats_week" },
				],
				[
					{ text: "📅 Месяц", callback_data: "stats_month" },
					{ text: "🔄 За всё время", callback_data: "stats_all" },
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

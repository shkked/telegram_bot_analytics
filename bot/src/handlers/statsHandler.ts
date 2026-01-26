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
			await ctx.reply("Это команда работает только в групповых чатах")
			return
		}

		const chatId = (ctx as any).update.message.chat.id
		// Получение статистики за всё время
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

		// Использовани inline keyboard для фильтрации
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
		console.error("Ошибка при сборе статистики:", error)
		await ctx.reply("Не удалось получить статистику")
	}
}

export async function onStatsCallback(ctx: Context): Promise<void> {
	try {
		const data = (ctx.callbackQuery as any)?.data || ""
		const period = data.replace("stats_", "")
		const daysAgo = TIME_PERIODS[period]

		if (!ctx.chat) {
			await ctx.answerCbQuery("Не удалось определить чат", { show_alert: true })
			return
		}

		const stats = await StatsService.getTopUsers(ctx.chat.id, 10, daysAgo)

		let periodText = ""
		if (period === "today") periodText = "Сегодня"
		else if (period === "week") periodText = "На этой неделе"
		else if (period === "month") periodText = "В этом месяце"
		else periodText = "За всё время"

		let message = `📊 <b>Статистика чата (${periodText})</b>\n\n`
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

		// Использование inline keyboard для фильтрации
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

		if (ctx.callbackQuery) {
			await ctx.editMessageText(message, {
				parse_mode: "HTML",
				reply_markup: keyboard,
			})
			await ctx.answerCbQuery()
		}
	} catch (error) {
		console.error("Ошибка в callback статистики:", error)
		await ctx.answerCbQuery("Не удалось получить статистику", {
			show_alert: true,
		})
	}
}

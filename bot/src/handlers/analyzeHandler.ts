import { Context } from "telegraf"
import { UserModel } from "../models/UserModel"
import { GeminiService } from "../services/GeminiService"


export async function onAnalyzeCommand(ctx: Context): Promise<void> {
	try {
		if (!ctx.message) {
			return
		}
		// Получение аргументов (username или user ID)
		const text = "text" in ctx.message ? ctx.message.text : ""
		let targetUsername: string | null = null
		let targetUser = null

		// Парсинг аргументов
		const parts = text.split(/\s+/)

		if (parts.length > 1) {
			// Пользователь предоставил username или @username
			targetUsername = parts[1].replace("@", "")
			targetUser = await UserModel.findByUsername(targetUsername)
		} else if ((ctx.message as any).reply_to_message) {
			// Ответ - анализ пользователя
			const repliedMessage = (ctx.message as any).reply_to_message
			if (repliedMessage.from) {
				targetUser = await UserModel.findByTelegramId(repliedMessage.from.id)
			}
		} else {
			await ctx.reply(
				"Как это работает:\n/analyze @username - анализ пользователя по имени\nОтветь на сообщение с /analyze - анализ автора сообщения",
			)
			return
		}

		if (!targetUser) {
			await ctx.reply(
				`У пользователя ${targetUsername || "Неизвестно"} нет сообщений в чате`,
			)
			return
		}

		// Отображение загрузки
		const loadingMsg = await ctx.reply("Анализируем пользователя...")

		try {
			const analysis = await GeminiService.analyzeUser(targetUser.id, 30)

			const userName = targetUser.username
				? `@${targetUser.username}`
				: targetUser.first_name || "Пользователь"

			let message = `🔍 <b>Анализ пользователя ${userName}</b>\n\n`
			message += `<b>Стиль общения:</b> ${analysis.style}\n`
			message += `<b>Тональность:</b> ${analysis.tone}\n`
			message += `<b>Основные темы:</b> ${
				analysis.topics.join(", ") || "Не определены"
			}\n`
			message += `<b>Средняя длина сообщений:</b> ${analysis.message_length}\n`
			message += `<b>Активность по времени суток:</b> ${analysis.activity_pattern}\n`
			message += `<b>Частые слова или выражения:</b> ${analysis.features}\n\n`
			message += `<i>Основано на ${analysis.message_count} сообщениях за последние ${analysis.days_period} дней</i>`

			await ctx.telegram.editMessageText(
				ctx.chat!.id,
				loadingMsg.message_id,
				undefined,
				message,
				{ parse_mode: "HTML" },
			)
		} catch (err) {
			console.error("Ошибка при анализе:", err)
			await ctx.telegram.editMessageText(
				ctx.chat!.id,
				loadingMsg.message_id,
				undefined,
				"Анализ не удался",
			)
		}
	} catch (error) {
		console.error("Ошибка при анализе:", error)
		await ctx.reply("Ошибка при анализе")
	}
}

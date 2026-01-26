import { Context } from "telegraf"
import { ChatModel } from "../models/ChatModel"
import { MessageModel } from "../models/MessageModel"
import { UserModel } from "../models/UserModel"

export async function onMessage(ctx: Context): Promise<void> {
	try {
		// Пропуск, если нет message или текста
		if (!ctx.message || !("text" in ctx.message)) {
			return
		}

		const message = ctx.message
		if (!message.from) {
			return
		}

		// Получение или создание пользователя
		const user = await UserModel.findOrCreate(
			message.from.id,
			message.from.username,
			message.from.first_name,
			message.from.last_name,
		)

		// Получение или создание чата
		if (!message.chat) {
			return
		}

		const chat = await ChatModel.findOrCreate(
			message.chat.id,
			(message.chat as any).title || "Неизвестно",
		)

		// Сохранение сообщения
		await MessageModel.create(chat.id, user.id, message.text)

		console.log(
			`Сообщение от ${user.username || user.first_name} в ${
				chat.title
			}: ${message.text.substring(0, 50)}`,
		)
	} catch (error) {
		console.error("Ошибка обработки сообщения:", error)
	}
}

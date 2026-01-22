import { Context } from "telegraf"
import { ChatModel } from "../models/ChatModel"
import { MessageModel } from "../models/MessageModel"
import { UserModel } from "../models/UserModel"

export async function onMessage(ctx: Context): Promise<void> {
	try {
		// Skip if not a message or not text
		if (!ctx.message || !("text" in ctx.message)) {
			return
		}

		const message = ctx.message
		if (!message.from) {
			return
		}

		// Get or create user
		const user = await UserModel.findOrCreate(
			message.from.id,
			message.from.username,
			message.from.first_name,
			message.from.last_name,
		)

		// Get or create chat
		if (!message.chat) {
			return
		}

		const chat = await ChatModel.findOrCreate(
			message.chat.id,
			(message.chat as any).title || "Unknown",
		)

		// Save message
		await MessageModel.create(chat.id, user.id, message.text)

		console.log(
			`Message from ${user.username || user.first_name} in ${
				chat.title
			}: ${message.text.substring(0, 50)}`,
		)
	} catch (error) {
		console.error("Error handling message:", error)
	}
}

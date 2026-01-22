import { execute, query, queryOne } from "../database"
import { IChat } from "../types"

export class ChatModel {
	static async findOrCreate(telegramId: number, title: string): Promise<IChat> {
		let chat = await this.findByTelegramId(telegramId)

		if (chat) {
			if (title !== chat.title) {
				await this.update(chat.id, title)
				chat.title = title
			}
			return chat
		}

		return await this.create(telegramId, title)
	}

	static async create(telegramId: number, title: string): Promise<IChat> {
		const result = await queryOne<IChat>(
			`INSERT INTO chats (telegram_id, title)
       VALUES ($1, $2)
       RETURNING id, telegram_id, title, created_at`,
			[telegramId, title],
		)

		if (!result) {
			throw new Error("Failed to create chat")
		}

		return result
	}

	static async findByTelegramId(telegramId: number): Promise<IChat | null> {
		return await queryOne<IChat>(
			"SELECT id, telegram_id, title, created_at FROM chats WHERE telegram_id = $1",
			[telegramId],
		)
	}

	static async findById(id: number): Promise<IChat | null> {
		return await queryOne<IChat>(
			"SELECT id, telegram_id, title, created_at FROM chats WHERE id = $1",
			[id],
		)
	}

	static async getAllChats(): Promise<IChat[]> {
		return await query<IChat>(
			"SELECT id, telegram_id, title, created_at FROM chats ORDER BY created_at DESC",
		)
	}

	static async update(id: number, title: string): Promise<void> {
		await execute("UPDATE chats SET title = $1 WHERE id = $2", [title, id])
	}
}

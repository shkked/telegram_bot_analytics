import { query, queryOne } from "../database"
import { IMessage, IStats } from "../types"

export class MessageModel {
	static async create(
		chatId: number,
		userId: number,
		text: string,
	): Promise<IMessage> {
		const result = await queryOne<IMessage>(
			`INSERT INTO messages (chat_id, user_id, text)
       VALUES ($1, $2, $3)
       RETURNING id, chat_id, user_id, text, created_at`,
			[chatId, userId, text],
		)

		if (!result) {
			throw new Error("Failed to create message")
		}

		return result
	}

	static async getMessagesByChatId(chatId: number): Promise<IMessage[]> {
		return await query<IMessage>(
			"SELECT id, chat_id, user_id, text, created_at FROM messages WHERE chat_id = $1 ORDER BY created_at ASC",
			[chatId],
		)
	}

	static async getMessagesByUserId(
		userId: number,
		limit?: number,
	): Promise<IMessage[]> {
		const limitClause = limit ? `LIMIT ${limit}` : ""
		return await query<IMessage>(
			`SELECT id, chat_id, user_id, text, created_at FROM messages 
       WHERE user_id = $1 
       ORDER BY created_at DESC ${limitClause}`,
			[userId],
		)
	}

	static async getMessagesByUserIdWithTimeFilter(
		userId: number,
		daysAgo: number,
		limit?: number,
	): Promise<IMessage[]> {
		const limitClause = limit ? `LIMIT ${limit}` : ""
		return await query<IMessage>(
			`SELECT id, chat_id, user_id, text, created_at FROM messages 
       WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '${daysAgo} days'
       ORDER BY created_at DESC ${limitClause}`,
			[userId],
		)
	}

	static async getTopUsersByMessages(
		chatId: number,
		limit: number = 10,
		daysAgo?: number,
	): Promise<IStats[]> {
		let queryStr = `
      SELECT 
        u.id as user_id, 
        u.username, 
        u.first_name,
        COUNT(m.id)::integer as message_count
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.chat_id = $1
    `

		const params: any[] = [chatId]

		if (daysAgo) {
			queryStr += ` AND m.created_at >= NOW() - INTERVAL '${daysAgo} days'`
		}

		queryStr += `
      GROUP BY u.id, u.username, u.first_name
      ORDER BY message_count DESC
      LIMIT $2
    `

		params.push(limit)

		return await query<IStats>(queryStr, params)
	}

	static async getTotalMessageCount(
		chatId: number,
		daysAgo?: number,
	): Promise<number> {
		let countQuery = "SELECT COUNT(*) as count FROM messages WHERE chat_id = $1"
		const params: any[] = [chatId]

		if (daysAgo) {
			countQuery += ` AND created_at >= NOW() - INTERVAL '${daysAgo} days'`
		}

		const result = await queryOne<{ count: number }>(countQuery, params)
		return result?.count || 0
	}

	static async getMessagesByChatAndUserWithTimeFilter(
		chatId: number,
		userId: number,
		daysAgo: number,
		limit: number = 100,
	): Promise<IMessage[]> {
		return await query<IMessage>(
			`SELECT id, chat_id, user_id, text, created_at FROM messages 
       WHERE chat_id = $1 AND user_id = $2 AND created_at >= NOW() - INTERVAL '${daysAgo} days'
       ORDER BY created_at DESC
       LIMIT $3`,
			[chatId, userId, limit],
		)
	}

	static async getTotalUniqueChatUsers(chatId: number): Promise<number> {
		const result = await queryOne<{ count: number }>(
			`SELECT COUNT(DISTINCT user_id) as count FROM messages WHERE chat_id = $1`,
			[chatId],
		)
		return result?.count || 0
	}
}

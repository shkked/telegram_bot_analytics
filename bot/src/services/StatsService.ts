import { MessageModel } from "../models/MessageModel"
import { UserModel } from "../models/UserModel"
import { IStats } from "../types"
import * as RedisService from "./RedisService"

const CACHE_TTL = parseInt(process.env.CACHE_TTL || "1200", 10) // 20 minutes default

export class StatsService {
	private static getCacheKey(
		chatId: number,
		type: string,
		period?: string,
	): string {
		return `stats:${chatId}:${type}${period ? `:${period}` : ""}`
	}

	static async getTopUsers(
		chatId: number,
		limit: number = 10,
		daysAgo?: number,
	): Promise<{ stats: IStats[]; totalMessages: number; totalUsers: number }> {
		const cacheKey = this.getCacheKey(
			chatId,
			"top_users",
			daysAgo ? `${daysAgo}d` : "all",
		)

		// Try to get from cache
		try {
			const cached = await RedisService.get(cacheKey)
			if (cached) {
				return cached
			}
		} catch (err) {
			console.warn("Cache retrieval failed:", err)
		}

		// Get data from database
		const stats = await MessageModel.getTopUsersByMessages(
			chatId,
			limit,
			daysAgo,
		)
		const totalMessages = await MessageModel.getTotalMessageCount(
			chatId,
			daysAgo,
		)
		const totalUsers = await MessageModel.getTotalUniqueChatUsers(chatId)

		const result = { stats, totalMessages, totalUsers }

		// Save to cache
		try {
			await RedisService.set(cacheKey, result, CACHE_TTL)
		} catch (err) {
			console.warn("Cache save failed:", err)
		}

		return result
	}

	static async getUserStats(
		userId: number,
		daysAgo?: number,
	): Promise<{ messageCount: number; user: any }> {
		const user = await UserModel.findById(userId)
		if (!user) {
			throw new Error("User not found")
		}

		const messages = daysAgo
			? await MessageModel.getMessagesByUserIdWithTimeFilter(userId, daysAgo)
			: await MessageModel.getMessagesByUserId(userId)

		return {
			user,
			messageCount: messages.length,
		}
	}

	static async clearCacheForChat(chatId: number): Promise<void> {
		try {
			await RedisService.delPattern(`stats:${chatId}:*`)
		} catch (err) {
			console.warn("Cache clear failed:", err)
		}
	}
}

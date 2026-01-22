import { beforeEach, describe, expect, it, vi } from "vitest"
import { MessageModel } from "../models/MessageModel"
import * as RedisService from "../services/RedisService"
import { StatsService } from "../services/StatsService"

// Mock dependencies
vi.mock("../models/MessageModel")
vi.mock("../services/RedisService")

describe("StatsService", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("should get top users with cache", async () => {
		const mockStats = [
			{ user_id: 1, username: "user1", first_name: "User", message_count: 100 },
			{
				user_id: 2,
				username: "user2",
				first_name: "Another",
				message_count: 50,
			},
		]

		vi.spyOn(RedisService, "get").mockResolvedValue(null)
		vi.spyOn(MessageModel, "getTopUsersByMessages").mockResolvedValue(mockStats)
		vi.spyOn(MessageModel, "getTotalMessageCount").mockResolvedValue(150)
		vi.spyOn(MessageModel, "getTotalUniqueChatUsers").mockResolvedValue(2)
		vi.spyOn(RedisService, "set").mockResolvedValue(undefined)

		const result = await StatsService.getTopUsers(1, 10)

		expect(result.stats).toEqual(mockStats)
		expect(result.totalMessages).toBe(150)
		expect(result.totalUsers).toBe(2)
		expect(RedisService.set).toHaveBeenCalled()
	})

	it("should return cached stats if available", async () => {
		const cachedResult = {
			stats: [
				{
					user_id: 1,
					username: "user1",
					first_name: "User",
					message_count: 100,
				},
			],
			totalMessages: 100,
			totalUsers: 1,
		}

		vi.spyOn(RedisService, "get").mockResolvedValue(cachedResult)

		const result = await StatsService.getTopUsers(1, 10)

		expect(result).toEqual(cachedResult)
		expect(MessageModel.getTopUsersByMessages).not.toHaveBeenCalled()
	})
})

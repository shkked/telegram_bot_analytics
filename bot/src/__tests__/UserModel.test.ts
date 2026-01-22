import { beforeEach, describe, expect, it, vi } from "vitest"
import * as db from "../database"
import { UserModel } from "../models/UserModel"

// Mock database
vi.mock("../database")

describe("UserModel", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("should find user by telegram id", async () => {
		const mockUser = {
			id: 1,
			telegram_id: 12345,
			username: "testuser",
			first_name: "Test",
			last_name: "User",
			created_at: new Date(),
		}

		vi.spyOn(db, "queryOne").mockResolvedValue(mockUser)

		const user = await UserModel.findByTelegramId(12345)

		expect(user).toEqual(mockUser)
		expect(db.queryOne).toHaveBeenCalled()
	})

	it("should return null when user not found", async () => {
		vi.spyOn(db, "queryOne").mockResolvedValue(null)

		const user = await UserModel.findByTelegramId(99999)

		expect(user).toBeNull()
	})

	it("should find user by username", async () => {
		const mockUser = {
			id: 1,
			telegram_id: 12345,
			username: "testuser",
			first_name: "Test",
			last_name: null,
			created_at: new Date(),
		}

		vi.spyOn(db, "queryOne").mockResolvedValue(mockUser)

		const user = await UserModel.findByUsername("testuser")

		expect(user?.username).toBe("testuser")
	})

	it("should create new user", async () => {
		const mockUser = {
			id: 1,
			telegram_id: 12345,
			username: "newuser",
			first_name: "New",
			last_name: "User",
			created_at: new Date(),
		}

		vi.spyOn(db, "queryOne").mockResolvedValue(mockUser)

		const user = await UserModel.create(12345, "newuser", "New", "User")

		expect(user.username).toBe("newuser")
		expect(user.telegram_id).toBe(12345)
	})
})

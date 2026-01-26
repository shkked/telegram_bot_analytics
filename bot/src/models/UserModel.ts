import { execute, query, queryOne } from "../database"
import { IUser } from "../types"

export class UserModel {
	static async findOrCreate(
		telegramId: number,
		username?: string,
		firstName?: string,
		lastName?: string,
	): Promise<IUser> {
		// Пытаемся найти пользователя по telegramId
		let user = await this.findByTelegramId(telegramId)

		if (user) {
			// Обновляем данные пользователя, если они изменились
			if (username || firstName || lastName) {
				await this.update(user.id, {
					username,
					first_name: firstName,
					last_name: lastName,
				})
				user = { ...user, username, first_name: firstName, last_name: lastName }
			}
			return user
		}

		// Создаем нового пользователя
		return await this.create(telegramId, username, firstName, lastName)
	}

	static async create(
		telegramId: number,
		username?: string,
		firstName?: string,
		lastName?: string,
	): Promise<IUser> {
		const result = await queryOne<IUser>(
			`INSERT INTO users (telegram_id, username, first_name, last_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, telegram_id, username, first_name, last_name, created_at`,
			[telegramId, username || null, firstName || null, lastName || null],
		)

		if (!result) {
			throw new Error("Ошибка при создании пользователя")
		}

		return result
	}

	static async findByTelegramId(telegramId: number): Promise<IUser | null> {
		return await queryOne<IUser>(
			"SELECT id, telegram_id, username, first_name, last_name, created_at FROM users WHERE telegram_id = $1",
			[telegramId],
		)
	}

	static async findById(id: number): Promise<IUser | null> {
		return await queryOne<IUser>(
			"SELECT id, telegram_id, username, first_name, last_name, created_at FROM users WHERE id = $1",
			[id],
		)
	}

	static async findByUsername(username: string): Promise<IUser | null> {
		return await queryOne<IUser>(
			"SELECT id, telegram_id, username, first_name, last_name, created_at FROM users WHERE username = $1",
			[username],
		)
	}

	static async getAllUsers(): Promise<IUser[]> {
		return await query<IUser>(
			"SELECT id, telegram_id, username, first_name, last_name, created_at FROM users ORDER BY created_at DESC",
		)
	}

	static async update(
		id: number,
		data: Partial<Omit<IUser, "id" | "telegram_id" | "created_at">>,
	): Promise<void> {
		const updates: string[] = []
		const values: any[] = []
		let paramCount = 1

		if (data.username !== undefined) {
			updates.push(`username = $${paramCount++}`)
			values.push(data.username)
		}
		if (data.first_name !== undefined) {
			updates.push(`first_name = $${paramCount++}`)
			values.push(data.first_name)
		}
		if (data.last_name !== undefined) {
			updates.push(`last_name = $${paramCount++}`)
			values.push(data.last_name)
		}

		if (updates.length === 0) return

		values.push(id)
		await execute(
			`UPDATE users SET ${updates.join(", ")} WHERE id = $${paramCount}`,
			values,
		)
	}
}

import { createClient } from "redis"

let redisClient: ReturnType<typeof createClient> | null = null
let redisAvailable = false

export async function initializeRedis(): Promise<void> {
	redisClient = createClient({
		url: process.env.REDIS_URL || "redis://localhost:6379",
		socket: {
			reconnectStrategy: false, // Отключить автоматическое переподключение
		},
	})

	try {
		await redisClient.connect()
		redisAvailable = true
		console.log("Redis подключен")
	} catch (error) {
		console.warn("Redis не удалось подключиться:", error)
		redisAvailable = false
		// Отключаем слушание событий ошибок
		redisClient?.removeAllListeners()
	}
}

export function getRedisClient() {
	if (!redisClient) {
		throw new Error(
			"Redis не инициализирован. Сначала вызовите initializeRedis().",
		)
	}
	return redisClient
}

export async function set(
	key: string,
	value: any,
	ttl?: number,
): Promise<void> {
	const client = getRedisClient()
	const serialized = JSON.stringify(value)

	if (ttl) {
		await client.setEx(key, ttl, serialized)
	} else {
		await client.set(key, serialized)
	}
}

export async function get<T = any>(key: string): Promise<T | null> {
	const client = getRedisClient()
	const value = await client.get(key)

	if (!value) return null

	try {
		return JSON.parse(value) as T
	} catch {
		return null
	}
}

export async function del(key: string): Promise<void> {
	const client = getRedisClient()
	await client.del(key)
}

export async function delPattern(pattern: string): Promise<void> {
	const client = getRedisClient()
	const keys = await client.keys(pattern)

	if (keys.length > 0) {
		await client.del(keys)
	}
}

export async function closeRedis(): Promise<void> {
	if (redisClient) {
		await redisClient.quit()
	}
}

import { Pool } from "pg"

let pool: Pool

export function initializeDatabase(): Pool {
	if (pool) return pool

	const dbConfig = {
		host: process.env.DB_HOST || "localhost",
		port: parseInt(process.env.DB_PORT || "5432"),
		user: process.env.DB_USER || "telegram_user",
		password: process.env.DB_PASSWORD || "telegram_password",
		database: process.env.DB_NAME || "telegram_bot",
	}

	console.log("Database config:", {
		host: dbConfig.host,
		port: dbConfig.port,
		user: dbConfig.user,
		database: dbConfig.database,
	})

	pool = new Pool(dbConfig)

	pool.on("error", err => {
		console.error("Unexpected error on idle client", err)
	})

	// Try to test the connection
	pool.query("SELECT NOW()", (err, result) => {
		if (err) {
			console.error("Database connection error:", err.message)
		} else {
			console.log("✅ Database connection successful")
		}
	})

	return pool
}

export function getPool(): Pool {
	if (!pool) {
		throw new Error(
			"Database pool not initialized. Call initializeDatabase() first.",
		)
	}
	return pool
}

export async function query<T = any>(
	text: string,
	params?: any[],
): Promise<T[]> {
	const client = await getPool().connect()
	try {
		const result = await client.query(text, params)
		return result.rows
	} finally {
		client.release()
	}
}

export async function queryOne<T = any>(
	text: string,
	params?: any[],
): Promise<T | null> {
	const results = await query<T>(text, params)
	return results.length > 0 ? results[0] : null
}

export async function execute(text: string, params?: any[]): Promise<number> {
	const client = await getPool().connect()
	try {
		const result = await client.query(text, params)
		return result.rowCount || 0
	} finally {
		client.release()
	}
}

export async function closePool(): Promise<void> {
	if (pool) {
		await pool.end()
	}
}

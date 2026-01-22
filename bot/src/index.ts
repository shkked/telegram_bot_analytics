import { Telegraf } from "telegraf"
import { initializeDatabase } from "./database"
import { onAnalyzeCommand } from "./handlers/analyzeHandler"
import { onMessage } from "./handlers/messageHandler"
import { onStatsCallback, onStatsCommand } from "./handlers/statsHandler"
import { onWordCloudCommand } from "./handlers/wordcloudHandler"
import { initializeRedis } from "./services/RedisService"

const token = process.env.TELEGRAM_TOKEN

if (!token) {
	throw new Error("TELEGRAM_TOKEN environment variable is not set")
}

const bot = new Telegraf(token)

async function start() {
	try {
		// Wait for services to be ready
		await new Promise(resolve => setTimeout(resolve, 3000))

		// Initialize database
		console.log("Initializing database...")
		initializeDatabase()

		// Initialize Redis
		console.log("Initializing Redis...")
		await initializeRedis()

		// Register handlers
		console.log("Registering handlers...")

		// Stats command
		bot.command("stats", onStatsCommand)
		bot.action(/^stats_/, onStatsCallback)

		// Analyze command
		bot.command("analyze", onAnalyzeCommand)

		// Word cloud command (custom feature)
		bot.command("wordcloud", onWordCloudCommand)

		// Handle all text messages
		bot.on("message", onMessage)

		// Start bot
		bot.launch()

		console.log("✅ Bot started successfully")

		// Enable graceful stop
		process.once("SIGINT", () => bot.stop("SIGINT"))
		process.once("SIGTERM", () => bot.stop("SIGTERM"))
	} catch (error) {
		console.error("❌ Failed to start bot:", error)
		process.exit(1)
	}
}

start()

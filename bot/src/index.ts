import './config/env' 
import { Telegraf } from "telegraf"
import { initializeDatabase } from "./database"
import { onAnalyzeCommand } from "./handlers/analyzeHandler"
import { onMessage } from "./handlers/messageHandler"
import { onStatsCallback, onStatsCommand } from "./handlers/statsHandler"
import { initializeRedis } from "./services/RedisService"

const token = process.env.TELEGRAM_TOKEN

if (!token) {
	throw new Error("Нет telegram токена")
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

		// Handle all text messages
		bot.on("message", onMessage)

		// Start bot
		bot.launch()

		// Enable graceful stop
		process.once("SIGINT", () => bot.stop("SIGINT"))
		process.once("SIGTERM", () => bot.stop("SIGTERM"))
	} catch (error) {
		console.error("❌ Failed to start bot:", error)
		process.exit(1)
	}
}

start()

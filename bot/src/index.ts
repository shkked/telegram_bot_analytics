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
		// Ожидаем, пока сервисы будут готовы
		await new Promise(resolve => setTimeout(resolve, 3000))

		// Инициализируем базу данных
		console.log("Инициализируем базу данных...")
		initializeDatabase()

		// Инициализируем Redis
		console.log("Инициализируем Redis...")
		await initializeRedis()

		// Регистрируем обработчики
		console.log("Регистрируем обработчики...")

		// Команда /stats
		bot.command("stats", onStatsCommand)
		bot.action(/^stats_/, onStatsCallback)

		// Команда /analyze
		bot.command("analyze", onAnalyzeCommand)

		// Обработка сообщений
		bot.on("message", onMessage)

		// Запускаем бота
		bot.launch()

		// Обрабатываем сигналы остановки
		process.once("SIGINT", () => bot.stop("SIGINT"))
		process.once("SIGTERM", () => bot.stop("SIGTERM"))
	} catch (error) {
		console.error("Ошибка при запуске бота", error)
		process.exit(1)
	}
}

start()

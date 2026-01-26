import './config/env'
import { createServer, IncomingMessage, ServerResponse } from "http"
import { initializeDatabase } from "./database"
import { UserModel } from "./models/UserModel"
import { GeminiService } from "./services/GeminiService"
import { initializeRedis } from "./services/RedisService"

const port = 3001

async function start() {
	try {
		// Ждем, когда сервисы будут готовы
		await new Promise(resolve => setTimeout(resolve, 3000))

		console.log("Инициализируем базу данных...")
		initializeDatabase()

		console.log("Инициализируем Redis...")
		await initializeRedis()

		const server = createServer(
			async (req: IncomingMessage, res: ServerResponse) => {
				// Включаем CORS
				res.setHeader("Access-Control-Allow-Origin", "*")
				res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
				res.setHeader("Access-Control-Allow-Headers", "Content-Type")

				if (req.method === "OPTIONS") {
					res.writeHead(200)
					res.end()
					return
				}

				// Парсим URL
				const url = new URL(req.url || "", `http://${req.headers.host}`)
				// GET /health
				if (req.method === "GET" && url.pathname === "/health") {
					res.writeHead(200, { "Content-Type": "application/json" })
					res.end(JSON.stringify({ status: "ok" }))
					return
				}
				// POST /analyze
				if (req.method === "POST" && url.pathname === "/analyze") {
					let body = ""

					req.on("data", chunk => {
						body += chunk
					})

					req.on("end", async () => {
						try {
							const data = JSON.parse(body)
							const username = data.username?.replace("@", "")

							if (!username) {
								res.writeHead(400, { "Content-Type": "application/json" })
								res.end(JSON.stringify({ error: "Имя пользователя обязательно" }))
								return
							}

							const user = await UserModel.findByUsername(username)

							if (!user) {
								res.writeHead(404, { "Content-Type": "application/json" })
								res.end(JSON.stringify({ error: "Пользователь не найден" }))
								return
							}

							const analysis = await GeminiService.analyzeUser(user.id, 30)

							res.writeHead(200, { "Content-Type": "application/json" })
							res.end(JSON.stringify(analysis))
						} catch (error: any) {
							console.error("Error:", error)
							res.writeHead(500, { "Content-Type": "application/json" })
							res.end(
								JSON.stringify({
									error: error.message || "Произошла ошибка на сервере",
								}),
							)
						}
					})

					return
				}

				// 404
				res.writeHead(404, { "Content-Type": "application/json" })
				res.end(JSON.stringify({ error: "Не найдено" }))
			},
		)

		server.listen(port, () => {
			console.log(`API сервер работает на порте ${port}`)
		})
	} catch (error) {
		console.error("Ошибка при запуске API сервера:", error)
		process.exit(1)
	}
}

start()

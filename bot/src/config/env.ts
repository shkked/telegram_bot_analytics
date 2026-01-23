import dotenv from "dotenv"
import fs from "fs"
import path from "path"

if (process.env.NODE_ENV !== "production") {
	const root = path.resolve(__dirname, "../../../")
	const envLocalPath = path.join(root, ".env.local")
	const envPath = path.join(root, ".env")

	dotenv.config({
		path: fs.existsSync(envLocalPath) ? envLocalPath : envPath,
	})
}

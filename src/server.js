import dotenv from "dotenv";
import { createApp } from "./app.js";
import { connectDatabase } from "./config/db.js";

dotenv.config();

const port = Number(process.env.PORT || 5000);

async function startServer() {
    await connectDatabase();

    const app = createApp();
    app.listen(port, () => {
        console.log(`ResumeSmart backend running on http://localhost:${port}`);
    });
}

startServer().catch((error) => {
    console.error("Failed to start backend:", error);
    process.exit(1);
});

import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { createAnalysis, getAnalysisById, latestAnalysis, listAnalyses } from "../controllers/analysisController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();
const uploadDirectory = path.resolve("uploads");

if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDirectory),
    filename: (_req, file, cb) => {
        const timestamp = Date.now();
        const safeName = file.originalname.replace(/\s+/g, "-");
        cb(null, `${timestamp}-${safeName}`);
    }
});

const upload = multer({ storage });

router.use(requireAuth);
router.post("/", upload.single("resume"), createAnalysis);
router.get("/", listAnalyses);
router.get("/latest", latestAnalysis);
router.get("/:id", getAnalysisById);

export default router;

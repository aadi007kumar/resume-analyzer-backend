import { Analysis } from "../models/Analysis.js";
import { generateAnalysis } from "../utils/analysisGenerator.js";
import { extractResumeText } from "../services/resumeParserService.js";
import { analyzeResumeWithOpenAI } from "../services/openaiAnalysisService.js";

export async function createAnalysis(req, res) {
    const { targetRole, companyName, jobDescription } = req.body;

    if (!targetRole) {
        return res.status(400).json({ message: "Target role is required." });
    }
    if (!req.file) {
        return res.status(400).json({ message: "Resume file is required." });
    }

    const generated = generateAnalysis({
        fileName: req.file.originalname,
        targetRole,
        companyName,
        jobDescription
    });

    const extractedText = await extractResumeText(req.file.path, req.file.originalname);
    const aiAnalysis = await analyzeResumeWithOpenAI({
        extractedText,
        targetRole,
        companyName,
        jobDescription
    });

    const analysis = await Analysis.create({
        user: req.user._id,
        filePath: req.file.path,
        extractedText,
        ...(aiAnalysis || generated),
        fileName: req.file.originalname,
        targetRole,
        companyName,
        jobDescription
    });

    return res.status(201).json({ analysis: analysis.toJSON() });
}

export async function listAnalyses(req, res) {
    const analyses = await Analysis.find({ user: req.user._id }).sort({ createdAt: -1 });
    return res.json({ analyses: analyses.map((analysis) => analysis.toJSON()) });
}

export async function latestAnalysis(req, res) {
    const analysis = await Analysis.findOne({ user: req.user._id }).sort({ createdAt: -1 });

    if (!analysis) {
        return res.status(404).json({ message: "No analyses found." });
    }

    return res.json({ analysis: analysis.toJSON() });
}

export async function getAnalysisById(req, res) {
    const analysis = await Analysis.findOne({
        _id: req.params.id,
        user: req.user._id
    });

    if (!analysis) {
        return res.status(404).json({ message: "Analysis not found." });
    }

    return res.json({ analysis: analysis.toJSON() });
}

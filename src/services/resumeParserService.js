import fs from "fs/promises";
import path from "path";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

export async function extractResumeText(filePath, fileName) {
    const extension = path.extname(fileName).toLowerCase();
    const fileBuffer = await fs.readFile(filePath);

    if (extension === ".pdf") {
        const parsed = await pdfParse(fileBuffer);
        return parsed.text?.trim() || "";
    }

    if (extension === ".docx") {
        const parsed = await mammoth.extractRawText({ buffer: fileBuffer });
        return parsed.value?.trim() || "";
    }

    if (extension === ".doc") {
        return "";
    }

    return "";
}

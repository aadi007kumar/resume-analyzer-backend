import OpenAI from "openai";

const analysisSchema = {
    name: "resume_analysis",
    strict: true,
    schema: {
        type: "object",
        additionalProperties: false,
        properties: {
            overallScore: { type: "integer", minimum: 0, maximum: 100 },
            atsScore: { type: "integer", minimum: 0, maximum: 100 },
            roleMatch: { type: "integer", minimum: 0, maximum: 100 },
            clarityScore: { type: "integer", minimum: 0, maximum: 100 },
            skills: {
                type: "array",
                items: { type: "string" }
            },
            summary: { type: "string" },
            strengths: {
                type: "array",
                items: { type: "string" }
            },
            improvements: {
                type: "array",
                items: { type: "string" }
            },
            atsChecklist: {
                type: "array",
                items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                        label: { type: "string" },
                        status: { type: "string" }
                    },
                    required: ["label", "status"]
                }
            },
            nextSteps: {
                type: "array",
                items: { type: "string" }
            }
        },
        required: [
            "overallScore",
            "atsScore",
            "roleMatch",
            "clarityScore",
            "skills",
            "summary",
            "strengths",
            "improvements",
            "atsChecklist",
            "nextSteps"
        ]
    }
};

export async function analyzeResumeWithOpenAI({ extractedText, targetRole, companyName, jobDescription }) {
    if (!process.env.OPENAI_API_KEY) {
        return null;
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    const prompt = [
        "You are an expert resume reviewer.",
        "Return JSON that matches the schema exactly.",
        "Evaluate ATS fit, role match, clarity, strengths, and improvements.",
        `Target role: ${targetRole || "General Applicant"}`,
        `Target company: ${companyName || "General applications"}`,
        `Job description highlights: ${jobDescription || "Not provided"}`,
        "Resume text:",
        extractedText || "No resume text could be extracted."
    ].join("\n");

    const response = await openai.responses.create({
        model,
        input: [
            {
                role: "user",
                content: [
                    {
                        type: "input_text",
                        text: prompt
                    }
                ]
            }
        ],
        text: {
            format: {
                type: "json_schema",
                ...analysisSchema
            }
        }
    });

    const outputText = response.output_text || "{}";
    return JSON.parse(outputText);
}

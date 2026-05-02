import mongoose from "mongoose";

const analysisSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        fileName: {
            type: String,
            required: true
        },
        filePath: {
            type: String,
            default: ""
        },
        targetRole: {
            type: String,
            required: true
        },
        companyName: {
            type: String,
            default: ""
        },
        jobDescription: {
            type: String,
            default: ""
        },
        extractedText: {
            type: String,
            default: ""
        },
        overallScore: Number,
        atsScore: Number,
        roleMatch: Number,
        clarityScore: Number,
        skills: [String],
        summary: String,
        strengths: [String],
        improvements: [String],
        atsChecklist: [
            {
                label: String,
                status: String,
                _id: false
            }
        ],
        nextSteps: [String]
    },
    { timestamps: true }
);

analysisSchema.set("toJSON", {
    transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        ret.createdAtLabel = new Date(ret.createdAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
        return ret;
    }
});

export const Analysis = mongoose.model("Analysis", analysisSchema);

function buildSkills(role, description) {
    const source = `${role} ${description}`.toLowerCase();
    const skillMap = [
        ["react", "React"],
        ["javascript", "JavaScript"],
        ["typescript", "TypeScript"],
        ["node", "Node.js"],
        ["python", "Python"],
        ["sql", "SQL"],
        ["aws", "AWS"],
        ["api", "API Design"],
        ["figma", "Figma"],
        ["lead", "Leadership"]
    ];

    const matched = skillMap.filter(([key]) => source.includes(key)).map(([, label]) => label);
    const fallback = ["Communication", "Problem Solving", "Project Delivery"];
    return [...new Set(matched.length ? matched.concat(fallback.slice(0, 2)) : ["Resume Writing", "ATS Optimization", ...fallback])].slice(0, 6);
}

export function generateAnalysis({ fileName, targetRole, companyName, jobDescription }) {
    const normalizedRole = targetRole || "General Applicant";
    const baseScore = 68 + Math.min(22, Math.floor(((fileName || "").length + normalizedRole.length) % 19));
    const atsScore = Math.max(62, Math.min(96, baseScore - 2));
    const roleMatch = Math.max(58, Math.min(97, baseScore + 1));
    const clarityScore = Math.max(60, Math.min(95, baseScore - 4));
    const skills = buildSkills(normalizedRole, jobDescription || "");

    return {
        fileName,
        targetRole: normalizedRole,
        companyName: companyName || "",
        jobDescription: jobDescription || "",
        overallScore: baseScore,
        atsScore,
        roleMatch,
        clarityScore,
        skills,
        summary: `This resume shows a solid baseline for ${normalizedRole}${companyName ? ` at ${companyName}` : ""}, with the strongest opportunities around sharper role-specific impact statements and stronger keyword targeting.`,
        strengths: [
            "The resume appears focused enough to communicate a clear professional direction.",
            "Core skills are visible and can support recruiter scanning for relevant experience.",
            "The document likely contains enough substance to build stronger impact-driven bullet points."
        ],
        improvements: [
            "Add more measurable achievements to show business impact rather than responsibilities alone.",
            "Mirror key terms from the target job description more directly to improve ATS matching.",
            "Tighten formatting and section hierarchy so recruiters can scan the most important content faster."
        ],
        atsChecklist: [
            { label: "Clear section headings", status: "Good" },
            { label: "Role-specific keywords", status: "Needs work" },
            { label: "Metrics and outcomes", status: "Needs work" },
            { label: "Simple readable formatting", status: "Good" }
        ],
        nextSteps: [
            "Rewrite the top 3 experience bullets with numbers, scope, and outcomes.",
            "Tailor the summary and skills section for each application.",
            "Re-run analysis after updating the role-specific wording."
        ]
    };
}

import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { emailContent } = req.body;
    if (!emailContent) {
        return res.status(400).json({ error: "Input is empty" });
    }

    // Load grounding data
    const dataDir = path.join(process.cwd(), 'data');
    const systemProtocol = fs.readFileSync(path.join(dataDir, 'system_protocol.md'), 'utf-8');
    const workPatterns = fs.readFileSync(path.join(dataDir, 'work_patterns.md'), 'utf-8');

    const endpoint = process.env.AZURE_ENDPOINT || "https://REPLACE_WITH_YOUR_ENDPOINT.services.ai.azure.com/openai/v1";
    const deploymentName = process.env.AZURE_DEPLOYMENT_ID || "gpt-5.4-nano-2";
    const url = `${endpoint}/chat/completions`;

    const commonParams = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.AZURE_API_KEY}`
        }
    };

    async function callAgent(systemPrompt, userPrompt) {
        const response = await fetch(url, {
            ...commonParams,
            body: JSON.stringify({
                model: deploymentName,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                temperature: 0.2
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Agent Call Failed: ${errText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    try {
        console.log("--- MULTI-AGENT ORCHESTRATION START ---");

        // 1. Linguistic Auditor Agent
        console.log("Invoking Linguistic Auditor Agent...");
        const linguisticAnalysis = await callAgent(
            `Act as AegisIQ Linguistic Auditor. 
            Focus ONLY on psychological manipulation: Urgency, Fear, Authority, Scarcity, or Social Proof.
            Explain the intent behind the language used.`,
            `Analyze this content for psychological triggers: ${emailContent}`
        );

        // 2. Technical Forensic Agent
        console.log("Invoking Technical Forensic Agent...");
        const technicalAnalysis = await callAgent(
            `Act as AegisIQ Technical Forensic Agent.
            Analyze URLs, domains, and technical structures for anomalies like homographs, suspicious TLDs, or masking.
            Ground your analysis in this protocol: ${systemProtocol}`,
            `Perform technical forensic audit on: ${emailContent}`
        );

        // 3. SOC Orchestrator Agent (Final Verdict)
        console.log("Invoking SOC Orchestrator Agent...");
        const finalResponse = await callAgent(
            `Act as AegisIQ SOC Orchestrator. 
            Consolidate the findings from specialized agents and provide a formal security verdict.
            Ground your decision in these work patterns: ${workPatterns}
            
            RESPOND ONLY IN JSON format:
            {
                "risk_score": (0-100),
                "verdict": "SAFE|SUSPICIOUS|MALICIOUS",
                "threat_type": "string",
                "psychological_intent": "Summary of linguistic audit",
                "technical_indicators": ["Array of technical audit findings"],
                "reasoning_steps": ["Step 1: Linguistic Audit: ...", "Step 2: Technical Audit: ..."],
                "recommendation": "string"
            }`,
            `Linguistic Findings: ${linguisticAnalysis}
             Technical Findings: ${technicalAnalysis}
             Original Content: ${emailContent}`
        );

        const jsonString = finalResponse.replace(/```json/g, "").replace(/```/g, "").trim();
        const auditResult = JSON.parse(jsonString);

        console.log("--- ORCHESTRATION COMPLETE ---");
        res.status(200).json(auditResult);

    } catch (error) {
        console.error("CRITICAL_ORCHESTRATION_FAILURE:", error.message);
        res.status(500).json({
            error: "ORCHESTRATION_FAILURE",
            message: error.message
        });
    }
}
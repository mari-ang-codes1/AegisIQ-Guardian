export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { emailContent } = req.body;

    if (!emailContent) {
        return res.status(400).json({ error: 'Email content is required' });
    }

    // Enterprise-grade Grounding (Simulated Foundry IQ logic)
    // In a real scenario, this would query a vector database or an organizational whitelist
    const trustedDomains = ["company.com", "partner-corp.net"];
    const senderDomain = (emailContent.match(/@([a-zA-Z0-9.-]+)/) || [])[1];
    const isWhitelisted = trustedDomains.includes(senderDomain);
    const groundingContext = isWhitelisted ? "Trusted Internal/Partner Domain" : "External Untrusted Source";

    try {
        const response = await fetch(process.env.AZURE_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': process.env.AZURE_API_KEY
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: "system",
                        content: `You are AegisIQ, a high-tier Cybersecurity AI expert specialized in Social Engineering and Phishing detection.
                        
                        Grounding Context: ${groundingContext}.
                        
                        Analyze the provided email content for malicious intent, fraud, or phishing. 
                        Use your advanced reasoning capabilities (Phi-4 style) to evaluate:
                        1. Psychological Tactics: Identify if the email uses Urgency, Fear, Authority, or Scarcity.
                        2. Linguistic Inconsistencies: Look for "off" tones or strange phrasing.
                        3. Risk Score: 0 to 100.
                        
                        Return ONLY a JSON object with this structure:
                        {
                            "score": number,
                            "verdict": "Clear" | "Suspicious" | "Malicious",
                            "phishing_type": "string",
                            "psychological_intent": ["string"],
                            "reasoning_trace": ["string"],
                            "analysis": "string",
                            "recommendation": "string"
                        }`
                    },
                    {
                        role: "user",
                        content: emailContent
                    }
                ],
                temperature: 0,
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            throw new Error(`Azure API error: ${response.statusText}`);
        }

        const data = await response.json();
        const auditResult = JSON.parse(data.choices[0].message.content);

        res.status(200).json({
            groundingResult: groundingContext,
            ...auditResult
        });
    } catch (error) {
        console.error('Audit Error:', error);

        // Professional Fallback Logic (Degraded Mode)
        // If Azure API fails, we still provide a basic verdict based on grounding to keep the app functional
        const isSuspicious = groundingContext === "External Untrusted Source";

        res.status(200).json({
            groundingResult: groundingContext,
            score: isSuspicious ? 50 : 10,
            verdict: isSuspicious ? "Suspicious (Degraded Mode)" : "Clear",
            phishing_type: "Unable to determine (AI Offline)",
            psychological_intent: ["Linguistic Analysis Unavailable"],
            reasoning_trace: ["Primary AI Reasoning Engine Unreachable", "Falling back to Grounding-only heuristics"],
            analysis: "CAUTION: The advanced reasoning engine is currently offline. This audit is based on basic source grounding only. Do not trust the result as a complete security audit.",
            recommendation: "Contact your SecOps administrator. The AI Cognitive Shield is in Degraded Mode."
        });
    }
}
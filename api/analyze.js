export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { emailContent } = req.body;
    if (!emailContent) {
        return res.status(400).json({ error: "Input is empty" });
    }

    // Configuration based on environment variables (Anonymized)
    const endpoint = process.env.AZURE_ENDPOINT || "https://REPLACE_WITH_YOUR_ENDPOINT.services.ai.azure.com/openai/v1";
    const deploymentName = process.env.AZURE_DEPLOYMENT_ID || "gpt-5.4-nano-2";
    const url = `${endpoint}/chat/completions`;

    try {
        console.log(`Invoking AegisIQ Core via ${deploymentName}...`);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.AZURE_API_KEY}` // Using Bearer token per Python SDK pattern
            },
            body: JSON.stringify({
                model: deploymentName,
                messages: [
                    {
                        role: "system",
                        content: `Act as AegisIQ Core: Enterprise Threat Intelligence Agent.
ALWAYS respond in ENGLISH ONLY, even if the input is in another language.
Provide a pure JSON response with these fields:
risk_score (number), 
verdict (SAFE|SUSPICIOUS|MALICIOUS), 
threat_type (string), 
psychological_intent (string), 
technical_indicators (array), 
recommendation (string - must be in English).`
                    },
                    {
                        role: "user",
                        content: emailContent
                    }
                ],
                temperature: 0.2
            })
        });

        const responseText = await response.text();

        if (!response.ok) {
            console.error("Azure Agent Error:", responseText);
            return res.status(response.status).json({
                error: "AGENT_FAILURE",
                details: responseText
            });
        }

        const data = JSON.parse(responseText);

        // Handle response structure (Chat Completion standard)
        if (data.choices && data.choices[0] && data.choices[0].message) {
            const content = data.choices[0].message.content;
            const jsonString = content.replace(/```json/g, "").replace(/```/g, "").trim();

            try {
                const auditResult = JSON.parse(jsonString);
                res.status(200).json(auditResult);
            } catch (e) {
                console.error("Failed to parse model-generated JSON:", jsonString);
                res.status(500).json({ error: "INVALID_JSON_OUTPUT", content });
            }
        } else {
            console.error("Unexpected Agent response:", data);
            res.status(500).json({ error: "UNEXPECTED_RESPONSE_FORMAT", data });
        }

    } catch (error) {
        console.error("CRITICAL_FAILURE in SOC backend:", error.message);
        res.status(500).json({
            error: "CRITICAL_FAILURE",
            message: error.message,
            recommendation: "Ensure AZURE_API_KEY is correct and the deployment name matches your Foundry portal."
        });
    }
}
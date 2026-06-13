export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Método no permitido" });
    }

    const { emailContent } = req.body;
    if (!emailContent) {
        return res.status(400).json({ error: "Input vacío" });
    }

    // Configuración basada en el nuevo Agente de Azure AI Foundry
    const endpoint = "https://mariaariaslopez-2797-resource.services.ai.azure.com/openai/v1";
    const deploymentName = "gpt-5.4-nano-2";
    const url = `${endpoint}/chat/completions`;

    try {
        console.log(`Invocando AegisIQ Core via ${deploymentName}...`);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.AZURE_API_KEY}` // Ahora usamos Bearer token como el SDK de Python
            },
            body: JSON.stringify({
                model: deploymentName,
                messages: [
                    {
                        role: "system",
                        content: `Actúa como AegisIQ Core: Motor de Inteligencia de Amenazas.
Responde ÚNICAMENTE con un JSON puro que contenga los campos: 
risk_score (number), 
verdict (SEGURO|SOSPECHOSO|MALICIOSO), 
threat_type (string), 
psychological_intent (string), 
technical_indicators (array), 
recommendation (string).`
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
            console.error("Error del Agente Azure AI:", responseText);
            return res.status(response.status).json({
                error: "AGENT_FAILURE",
                details: responseText
            });
        }

        const data = JSON.parse(responseText);

        // Manejo de la estructura de respuesta (Chat Completion standard)
        if (data.choices && data.choices[0] && data.choices[0].message) {
            const content = data.choices[0].message.content;
            const jsonString = content.replace(/```json/g, "").replace(/```/g, "").trim();

            try {
                const auditResult = JSON.parse(jsonString);
                res.status(200).json(auditResult);
            } catch (e) {
                console.error("Fallo al parsear JSON del modelo:", jsonString);
                res.status(500).json({ error: "INVALID_JSON_OUTPUT", content });
            }
        } else {
            console.error("Respuesta inesperada del Agente:", data);
            res.status(500).json({ error: "UNEXPECTED_RESPONSE_FORMAT", data });
        }

    } catch (error) {
        console.error("Fallo crítico en el backend SOC:", error.message);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR", details: error.message });
    }
}
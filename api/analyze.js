export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Método no permitido" });
    }

    const { emailContent } = req.body;

    // URL de Inferencia con el modelo Phi-4-reasoning
    const url = "https://mariaariaslopez-2797-resource.services.ai.azure.com/openai/deployments/Phi-4-reasoning/chat/completions?api-version=2024-02-15-preview";

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': process.env.AZURE_API_KEY
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: "system",
                        content: "Eres AegisIQ Core. Responde ÚNICAMENTE con un JSON puro que siga este esquema: {\"risk_score\": number, \"verdict\": string, \"threat_type\": string, \"psychological_intent\": string, \"technical_indicators\": [string], \"recommendation\": string}. NO incluyas markdown, NO incluyas explicaciones, NO incluyas texto antes o después del JSON."
                    },
                    { role: "user", content: emailContent }
                ],
                // Ajustes de rendimiento para evitar Timeout 504
                temperature: 0.1,
                max_tokens: 400,
                frequency_penalty: 0,
                presence_penalty: 0
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error("Error de Azure:", errorData);
            return res.status(response.status).json({ error: "AZURE_REJECTED", details: errorData });
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        // Limpieza agresiva de cualquier cosa que no sea el JSON
        const jsonString = content.replace(/```json/g, "").replace(/```/g, "").trim();

        res.status(200).json(JSON.parse(jsonString));

    } catch (error) {
        console.error("Error en el handler:", error);
        res.status(500).json({ error: "INTERNAL_ERROR", details: error.message });
    }
}
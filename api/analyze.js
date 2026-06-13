export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Método no permitido" });
    }

    const { emailContent } = req.body;
    
    // URL de Inferencia hacia el modelo desplegado
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
                        role: "user", 
                        content: `Analiza este texto de seguridad y responde ÚNICAMENTE con un JSON puro que contenga los campos: risk_score, verdict, threat_type, psychological_intent, technical_indicators, recommendation. Texto a analizar: ${emailContent}` 
                    }
                ]
            })
        });

        // Capturamos la respuesta como texto primero para diagnosticar
        const rawResponse = await response.text();

        if (!response.ok) {
            console.error("Error detallado de Azure:", rawResponse);
            return res.status(500).json({ error: "AZURE_ERROR", details: rawResponse });
        }

        const data = JSON.parse(rawResponse);
        const content = data.choices[0].message.content;

        // Limpieza de posibles bloques markdown
        const jsonString = content.replace(/```json/g, "").replace(/```/g, "").trim();

        res.status(200).json(JSON.parse(jsonString));

    } catch (error) {
        console.error("Error crítico en el backend:", error);
        res.status(500).json({ error: "INTERNAL_ERROR", details: error.message });
    }
}
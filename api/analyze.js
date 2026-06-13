export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { emailContent } = req.body;

    // Usamos el endpoint exacto que te dio el portal de Azure
    const url = "https://mariaariaslopez-2797-resource.services.ai.azure.com/openai/deployments/Phi-4-reasoning/chat/completions?api-version=2024-02-15-preview";

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': process.env.AZURE_API_KEY // Esta es tu clave de la imagen 1
            },
            body: JSON.stringify({
                messages: [
                    { 
                        role: "system", 
                        content: "Analiza el mensaje y responde con un JSON estricto: { \"risk_score\": 0, \"verdict\": \"SEGURO\", \"threat_type\": \"N/A\", \"psychological_intent\": \"N/A\", \"technical_indicators\": [], \"recommendation\": \"N/A\" }" 
                    },
                    { role: "user", content: emailContent }
                ],
                temperature: 0.2
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Azure Error:", JSON.stringify(data));
            return res.status(500).json({ error: "AZURE_REJECTED", details: data });
        }

        // Parseamos la respuesta de la IA
        const auditResult = JSON.parse(data.choices[0].message.content.replace(/```json|```/g, ""));
        res.status(200).json(auditResult);

    } catch (error) {
        res.status(500).json({ error: "CRITICAL_FAILURE", details: error.message });
    }
}
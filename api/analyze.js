export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { emailContent } = req.body;

    // FORZAMOS EL ENDPOINT CORRECTO aquí mismo para no depender de Vercel variables si están mal
    const url = "https://mariaariaslopez-2797-resource.services.ai.azure.com/openai/deployments/Phi-4-reasoning/chat/completions?api-version=2024-02-15-preview";

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': process.env.AZURE_API_KEY // Solo necesitamos esto
            },
            body: JSON.stringify({
                messages: [
                    { role: "system", content: "Responde estrictamente con un objeto JSON: { \"risk_score\": 0, \"verdict\": \"SEGURO\", \"threat_type\": \"N/A\", \"psychological_intent\": \"N/A\", \"technical_indicators\": [], \"recommendation\": \"N/A\" }" },
                    { role: "user", content: emailContent }
                ],
                temperature: 0.2
            })
        });

        const data = await response.json();

        if (!response.ok) {
            // Esto nos dirá exactamente por qué falla
            return res.status(500).json({ error: "AZURE_REJECTED", details: data });
        }

        const auditResult = JSON.parse(data.choices[0].message.content.replace(/```json|```/g, ""));
        res.status(200).json(auditResult);

    } catch (error) {
        res.status(500).json({ error: "CRITICAL_FAILURE", details: error.message });
    }
}
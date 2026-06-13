export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const { emailContent } = req.body;

    // USA ESTA URL EXACTA
    const url = "https://mariaariaslopez-2797-resource.services.ai.azure.com/openai/deployments/Phi-4-reasoning/chat/completions?api-version=2024-02-15-preview";

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': process.env.AZURE_API_KEY // Asegúrate que esta variable en Vercel sea la Clave 1
            },
            body: JSON.stringify({
                messages: [
                    { role: "system", content: "Responde estrictamente con un JSON." },
                    { role: "user", content: emailContent }
                ],
                temperature: 0.2
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Error de Azure:", data);
            return res.status(500).json({ error: "AZURE_FAIL", details: data });
        }

        res.status(200).json(JSON.parse(data.choices[0].message.content.replace(/```json|```/g, "")));

    } catch (error) {
        res.status(500).json({ error: "INTERNAL_ERROR", details: error.message });
    }
}
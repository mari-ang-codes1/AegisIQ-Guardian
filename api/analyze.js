export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { emailContent } = req.body;

    if (!emailContent) {
        return res.status(400).json({ error: 'Email content is required' });
    }

    // Dynamic URL construction for Azure AI Foundry
    const url = `${process.env.AZURE_ENDPOINT.replace(/\/$/, "")}/openai/deployments/Phi-4-reasoning/chat/completions?api-version=2024-02-15-preview`;

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
                        content: `Actúa como AegisIQ Core: Motor de Inteligencia de Amenazas de Nivel SOC. 

Tu arquitectura interna de razonamiento está diseñada para auditar la integridad de comunicaciones digitales. Analiza el input (URL o mensaje) con rigor quirúrgico.

Tu objetivo es detectar:
1. Ingeniería Social: Urgencia artificial, suplantación de identidad (spoofing), explotación de emociones.
2. Indicadores Técnicos: Anomalías en dominios (homógrafos, TLDs sospechosos), patrones de enlace malicioso, ocultación de URLs.

DEBES responder con un objeto JSON estricto y sin texto adicional:
{
  "risk_score": number, 
  "verdict": "SEGURO" | "SOSPECHOSO" | "MALICIOSO",
  "threat_type": string,
  "psychological_intent": string,
  "technical_indicators": [string],
  "recommendation": string
}

REGLAS DE ORO:
- Si el input es una URL: Analiza si el dominio intenta engañar visualmente al usuario.
- Si el input es texto: Analiza la intención oculta detrás de la estructura gramatical.
- Tu veredicto debe ser conservador: Si hay 1% de duda, marca como SOSPECHOSO.`
                    },
                    {
                        role: "user",
                        content: emailContent
                    }
                ],
                temperature: 0.2
            })
        });

        if (!response.ok) {
            console.error(`Azure API Error Status: ${response.status}`);
            const errorText = await response.text();
            console.error(`Azure API Error Message: ${errorText}`);
            throw new Error(`Azure API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const auditResult = JSON.parse(data.choices[0].message.content);

        res.status(200).json(auditResult);
    } catch (error) {
        console.error('Detailed Audit Error:', error.message);

        res.status(500).json({
            risk_score: 50,
            verdict: "SOSPECHOSO",
            threat_type: "Error Técnico de Conexión",
            psychological_intent: "Análisis interrumpido por fallo en el motor IR.",
            technical_indicators: [`Error de red o configuración: ${error.message}`],
            recommendation: "Contacte con el administrador de SOC. Revise logs de Azure (Endpoint/Deployments)."
        });
    }
}
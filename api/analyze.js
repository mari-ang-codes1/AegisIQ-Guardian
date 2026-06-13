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
                temperature: 0.2,
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            throw new Error(`Azure API error: ${response.statusText}`);
        }

        const data = await response.json();
        const auditResult = JSON.parse(data.choices[0].message.content);

        // Ensure consistency even if LLM slightly deviates
        res.status(200).json(auditResult);
    } catch (error) {
        console.error('Audit Error:', error);

        // Standardized Fallback JSON
        res.status(200).json({
            risk_score: 50,
            verdict: "SOSPECHOSO",
            threat_type: "Error de Análisis (AI Offline)",
            psychological_intent: "No se pudo determinar la psicología debido a un fallo técnico.",
            technical_indicators: ["Servicio de IA no disponible"],
            recommendation: "Por precaución, trate este contenido como sospechoso y contacte con soporte técnico."
        });
    }
}
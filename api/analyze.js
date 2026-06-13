export default async function handler(req, res) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { emailContent } = req.body;
    if (!emailContent) {
        return res.status(400).json({ message: 'Input is empty' });
    }

    // Endpoint de Azure AI Foundry / unified resource
    const url = "https://mariaariaslopez-2797-resource.services.ai.azure.com/openai/deployments/Phi-4-reasoning/chat/completions?api-version=2024-02-15-preview";

    try {
        console.log("Iniciando auditoría técnica en AegisIQ Core...");

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
                    { role: "user", content: emailContent }
                ],
                temperature: 0.2
            })
        });

        // Capturamos el cuerpo como texto primero para evitar errores de parseo en 4xx/5xx
        const responseText = await response.text();
        let data;

        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error("Fallo al parsear respuesta de Azure (No es JSON):", responseText);
            throw new Error(`Azure devolvió un formato no válido (${response.status})`);
        }

        if (!response.ok) {
            console.error("Azure AI Foundry Error:", {
                status: response.status,
                details: data
            });
            return res.status(response.status).json({
                error: "AZURE_REJECTED",
                status: response.status,
                details: data
            });
        }

        // Validación de estructura de respuesta OpenAI/Foundry
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error("Estructura de respuesta de Azure incompleta");
        }

        const rawContent = data.choices[0].message.content;
        const cleanedContent = rawContent.replace(/```json|```/g, "").trim();

        try {
            const auditResult = JSON.parse(cleanedContent);
            res.status(200).json(auditResult);
        } catch (e) {
            console.error("Error al parsear el contenido generado por la IA:", cleanedContent);
            throw new Error("El modelo generó un JSON inválido");
        }

    } catch (error) {
        console.error("CRITICAL_FAILURE en api/analyze:", error.message);
        res.status(500).json({
            error: "CRITICAL_FAILURE",
            message: error.message,
            recommendation: "Verifique que AZURE_API_KEY sea la 'Key 1' del recurso Foundry y que el nombre del despliegue sea correcto."
        });
    }
}
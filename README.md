# AegisIQ: Advanced Cognitive Social Engineering Shield

AegisIQ is an enterprise-grade automated SecOps agent designed to mitigate the "human element" in cybersecurity. By utilizing **Microsoft Foundry IQ** for grounding and **Phi-4** for multi-step cognitive reasoning, AegisIQ intercepts and audits communication vectors to detect psychological manipulation and sophisticated social engineering tactics.

## 🚀 Vision
The human link is the most exploited vulnerability in the security chain. 95% of breaches start with a human error. AegisIQ shifts the defense from reactive firewalls to proactive cognitive auditing.

## 🛠 Tech Stack
- **Frontend**: Vanilla JS, Glassmorphism UI (CSS), Lucide Icons.
- **Backend Proxy**: Vercel/Azure Serverless Functions.
- **Intelligence Layer**: Microsoft Foundry IQ & Phi-4.

## 🛡 Security Architecture
- **Environment Isolation**: API keys are strictly managed via server-side environment variables (`AZURE_API_KEY`, `AZURE_ENDPOINT`).
- **Proxy Pattern**: No direct communication from the client to Azure OpenAI, preventing credential exposure and enabling centralized grounding logic.
- **Grounding Integration**: Real-time context validation against organizational data to identify "impersonation" vs. "trusted" sources.

## ✨ Advanced Features
- **Psychological Intent Analysis**: Detects tactics like Urgency, Fear, Scarcity, and Authority.
- **Cognitive Reasoning Trace**: Provides transparency into the AI's decision-making process.
- **Risk Scoring**: Precision scoring (0-100) based on linguistic and contextual anomalies.

---
**Author**: AegisIQ Development Team (Hackathon Edition)
**Disclaimer**: This solution is a prototype developed for the Microsoft Agents League Hackathon.

/**
 * AegisIQ - Advanced Social Engineering Interception System
 * Frontend Logic (Enterprise-Grade)
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Local DB if empty
    if (!localStorage.getItem('aegis_db_logs')) {
        localStorage.setItem('aegis_db_logs', JSON.stringify([]));
    }

    // Initial UI Render
    updateDashboardMetrics();
    renderIncidentLogs();

    // Bind Audit Trigger
    const auditBtn = document.getElementById('audit-btn');
    if (auditBtn) {
        auditBtn.addEventListener('click', handleAuditFlow);
    }
});

/**
 * Main Audit Handler
 * Routes request through Backend Proxy for Security & Grounding
 */
async function handleAuditFlow() {
    const emailContent = document.getElementById('email-content').value.trim();

    if (!emailContent) {
        alert("🛡️ Input Required: Please paste email content to analyze.");
        return;
    }

    setLoadingState(true);

    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emailContent })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Security Proxy Error');
        }

        const data = await response.json();

        // Save to Local DB
        saveIncidentToDB(emailContent, data);

        // Update UI
        displayAuditResults(data);
        updateDashboardMetrics();
        renderIncidentLogs();

    } catch (error) {
        console.error('Audit Failure:', error);
        alert(`❌ Critical Audit Failure: ${error.message}`);
    } finally {
        setLoadingState(false);
    }
}

/**
 * Persistance Layer
 */
function saveIncidentToDB(content, result) {
    const logs = JSON.parse(localStorage.getItem('aegis_db_logs')) || [];

    const newIncident = {
        id: `AEGIS-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toLocaleString(),
        preview: content.substring(0, 80) + (content.length > 80 ? "..." : ""),
        score: result.score,
        verdict: result.verdict,
        type: result.phishing_type
    };

    logs.unshift(newIncident);
    localStorage.setItem('aegis_db_logs', JSON.stringify(logs));
}

/**
 * UI Rendering Logic
 */
function displayAuditResults(result) {
    const resultsSection = document.getElementById('results-section');

    // Score & Verdict
    document.getElementById('res-score').innerText = `${result.score}%`;
    document.getElementById('res-verdict').innerText = result.verdict;
    document.getElementById('res-type').innerText = result.phishing_type;
    document.getElementById('res-analysis').innerText = result.analysis;
    document.getElementById('res-recommendation').innerText = result.recommendation;

    // Badges
    const badge = document.getElementById('verdict-badge');
    badge.className = 'badge-base';
    if (result.score >= 70) badge.classList.add('badge-danger');
    else if (result.score >= 35) badge.classList.add('badge-warning');
    else badge.classList.add('badge-success');

    // Psychological Metrics
    const psychContainer = document.getElementById('res-psychological');
    psychContainer.innerHTML = '';
    if (result.psychological_intent) {
        result.psychological_intent.forEach(intent => {
            const span = document.createElement('span');
            span.className = 'tag';
            span.innerText = intent;
            psychContainer.appendChild(span);
        });
    }

    // Reasoning Trace
    const reasoningList = document.getElementById('res-reasoning');
    reasoningList.innerHTML = '';
    if (result.reasoning_trace) {
        result.reasoning_trace.forEach(step => {
            const li = document.createElement('li');
            li.innerText = step;
            reasoningList.appendChild(li);
        });
    }

    resultsSection.classList.remove('hidden');
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

function setLoadingState(isLoading) {
    const btn = document.getElementById('audit-btn');
    const btnText = document.getElementById('btn-text');

    if (isLoading) {
        btn.disabled = true;
        btnText.innerText = "Intercepting threats with Phi-4 Cognitive Engine...";
    } else {
        btn.disabled = false;
        btnText.innerText = "Audit Email Content";
    }
}

function updateDashboardMetrics() {
    const logs = JSON.parse(localStorage.getItem('aegis_db_logs')) || [];

    document.getElementById('metric-total').innerText = logs.length;

    const threats = logs.filter(log => log.score >= 35).length;
    document.getElementById('metric-blocked').innerText = threats;

    if (logs.length > 0) {
        const sum = logs.reduce((acc, log) => acc + log.score, 0);
        document.getElementById('metric-avg-risk').innerText = `${Math.round(sum / logs.length)}%`;
    } else {
        document.getElementById('metric-avg-risk').innerText = "0%";
    }
}

function renderIncidentLogs() {
    const logs = JSON.parse(localStorage.getItem('aegis_db_logs')) || [];
    const tableBody = document.getElementById('logs-table-body');

    if (!tableBody) return;
    tableBody.innerHTML = '';

    if (logs.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center-muted">No incidents recorded in the local database.</td></tr>`;
        return;
    }

    logs.forEach(log => {
        const row = document.createElement('tr');
        const statusClass = log.score >= 70 ? 'text-danger' : log.score >= 35 ? 'text-warning' : 'text-success';

        row.innerHTML = `
            <td><strong>${log.id}</strong></td>
            <td>${log.date}</td>
            <td style="color: var(--text-muted); font-style: italic;">"${log.preview}"</td>
            <td><span class="${statusClass}">● ${log.verdict}</span></td>
            <td><strong>${log.score}%</strong></td>
        `;
        tableBody.appendChild(row);
    });
}
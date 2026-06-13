/**
 * AegisIQ Core - SOC Intelligence Engine
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Local DB
    if (!localStorage.getItem('aegis_soc_logs')) {
        localStorage.setItem('aegis_soc_logs', JSON.stringify([]));
    }

    renderLogs();

    const scanBtn = document.getElementById('scan-btn');
    if (scanBtn) {
        scanBtn.addEventListener('click', handleScan);
    }

    // Allow Enter key to trigger scan
    document.getElementById('input-field').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleScan();
    });
});

async function handleScan() {
    const inputData = document.getElementById('input-field').value.trim();

    if (!inputData) {
        alert("🛡️ Input Required: Please enter a URL or suspicious content.");
        return;
    }

    setScanningState(true);

    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emailContent: inputData })
        });

        if (!response.ok) throw new Error('Communication failed with AegisIQ Core');

        const data = await response.json();

        // Update UI Panels
        updateUI(data);

        // Persistent Logs
        saveLog(data);
        renderLogs();

    } catch (error) {
        console.error('SOC Error:', error);
        alert(`❌ System Error: ${error.message}`);
    } finally {
        setScanningState(false);
    }
}

function setScanningState(isScanning) {
    const btn = document.getElementById('scan-btn');
    const searchWrapper = document.getElementById('search-bar');
    const input = document.getElementById('input-field');

    if (isScanning) {
        btn.disabled = true;
        btn.innerHTML = '<i data-lucide="loader"></i> SCANNING...';
        searchWrapper.classList.add('scanning', 'pulse');
        input.disabled = true;
    } else {
        btn.disabled = false;
        btn.innerHTML = '<i data-lucide="shield-alert"></i> SCAN';
        searchWrapper.classList.remove('scanning', 'pulse');
        input.disabled = false;
        lucide.createIcons();
    }
}

function updateUI(data) {
    // 1. Risk Score
    const riskEl = document.getElementById('risk-score');
    riskEl.innerText = `${data.risk_score}%`;
    riskEl.style.color = data.risk_score > 70 ? 'var(--accent-neon-red)' : data.risk_score > 30 ? 'var(--accent-cobalt)' : 'var(--accent-safe)';

    // 2. Global Verdict
    const badge = document.getElementById('threat-badge');
    const type = document.getElementById('threat-type');
    badge.classList.remove('hidden');
    badge.innerText = data.verdict;
    badge.style.color = data.risk_score > 70 ? 'var(--accent-neon-red)' : data.risk_score > 30 ? 'var(--accent-cobalt)' : 'var(--accent-safe)';

    type.innerText = data.threat_type.toUpperCase();
    type.style.color = 'var(--text-bright)';

    // 3. Technical Analysis
    const list = document.getElementById('indicator-list');
    list.innerHTML = '';

    // Add Psychological Intent as first indicator
    const intentLi = document.createElement('li');
    intentLi.innerHTML = `<strong>INTENT:</strong> ${data.psychological_intent}`;
    list.appendChild(intentLi);

    if (data.technical_indicators && data.technical_indicators.length > 0) {
        data.technical_indicators.forEach(ind => {
            const li = document.createElement('li');
            li.innerText = ind;
            list.appendChild(li);
        });
    }

    document.getElementById('recommendation-text').innerText = data.recommendation;

    // 4. Reasoning Chain (New)
    const reasoningList = document.getElementById('reasoning-list');
    if (reasoningList && data.reasoning_steps) {
        reasoningList.innerHTML = data.reasoning_steps.map((step, index) => `
            <div class="reasoning-step" style="animation-delay: ${index * 0.2}s">
                ${step}
            </div>
        `).join('');
    }
}

function saveLog(data) {
    const logs = JSON.parse(localStorage.getItem('aegis_soc_logs')) || [];
    const newEntry = {
        date: new Date().toLocaleTimeString(),
        verdict: data.verdict,
        score: data.risk_score
    };
    logs.unshift(newEntry);
    if (logs.length > 10) logs.pop(); // Keep last 10
    localStorage.setItem('aegis_soc_logs', JSON.stringify(logs));
}

function renderLogs() {
    const logs = JSON.parse(localStorage.getItem('aegis_soc_logs')) || [];
    const tbody = document.getElementById('logs-body');
    if (!tbody) return;

    tbody.innerHTML = logs.map(log => `
        <tr>
            <td style="color: var(--text-dim)">${log.date}</td>
            <td style="color: ${log.score > 70 ? 'var(--accent-neon-red)' : 'var(--accent-cobalt)'}">${log.verdict}</td>
            <td style="font-weight: 900">${log.score}%</td>
        </tr>
    `).join('') || '<tr><td colspan="3" style="text-align:center; color: var(--text-dim)">NO RECORDS FOUND</td></tr>';
}
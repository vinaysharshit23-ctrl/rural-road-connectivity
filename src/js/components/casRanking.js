/**
 * CAS Ranking & Formula Explainer Component
 * Manages rendering of the dedicated Accessibility Score Leaderboard,
 * 7-Pillar Calculation Breakdown, and sorting options.
 */

let casSortField = 'casCurrent';
let casSortDir = 'asc'; // Ascending by default so most isolated (lowest CAS) is #1

export function renderCasRankingView(villages, onInspectVillage) {
  renderCasFormulaExplainer();
  renderCasTableBody(villages, onInspectVillage);
  setupCasSorting(villages, onInspectVillage);
}

function renderCasFormulaExplainer() {
  const container = document.getElementById('casFormulaExplainerContainer');
  if (!container) return;

  container.innerHTML = `
    <div style="background: rgba(13, 20, 36, 0.85); border: 1px solid var(--border-glass-glow); border-radius: 20px; padding: 1.75rem; margin-bottom: 2rem; box-shadow: var(--shadow-lg)">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem">
        <div>
          <div style="font-size: 0.78rem; font-weight: 800; text-transform: uppercase; color: var(--accent-cyan); letter-spacing: 0.08em; margin-bottom: 0.2rem">
            🧮 Empirical Methodology & Mathematical Formulation
          </div>
          <h2 style="font-size: 1.35rem; font-weight: 800; color: #fff">
            Comprehensive Accessibility Score (CAS) Engine
          </h2>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.25rem">
            Evaluates rural village isolation on a normalized scale of <strong>0.0 to 100.0</strong> (where 0.0 = Total Isolation and 100.0 = Optimal Accessibility) as a weighted linear combination of 7 multi-sector pillars.
          </p>
        </div>
        <div style="background: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.35); padding: 0.5rem 1rem; border-radius: 12px; text-align: right">
          <div style="font-size: 0.7rem; color: var(--text-muted)">State Base Average</div>
          <div style="font-family: var(--font-mono); font-weight: 800; color: #ef4444; font-size: 1.1rem">24.8 / 100</div>
        </div>
      </div>

      <!-- Formula Equation Card -->
      <div style="background: rgba(5, 8, 17, 0.9); border: 1px solid rgba(56, 189, 248, 0.35); border-radius: 14px; padding: 1.1rem 1.4rem; margin-bottom: 1.25rem; font-family: var(--font-mono); text-align: center; border-left: 4px solid var(--accent-cyan); box-shadow: 0 4px 20px rgba(0,0,0,0.4)">
        <div style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.4rem">
          📐 Mathematical Formula & Weight Equation
        </div>
        <div style="font-size: 1.05rem; font-weight: 800; color: #ffffff; letter-spacing: 0.02em; line-height: 1.6">
          <span style="color: var(--accent-cyan); font-size: 1.15rem">CAS Score</span> = 
          <span style="color: #38bdf8">0.20 × S<sub>Urban</sub></span> + 
          <span style="color: #10b981">0.18 × S<sub>Road</sub></span> + 
          <span style="color: #f59e0b">0.15 × S<sub>Highway</sub></span> + 
          <span style="color: #f43f5e">0.16 × S<sub>Health</sub></span> + 
          <span style="color: #c084fc">0.11 × S<sub>Edu</sub></span> + 
          <span style="color: #fbbf24">0.12 × S<sub>Mandi</sub></span> + 
          <span style="color: #38bdf8">0.08 × S<sub>Transit</sub></span>
        </div>
        <div style="font-size: 0.74rem; color: var(--text-secondary); margin-top: 0.45rem; font-family: var(--font-main)">
          Sum of weights = 1.00 (100%). Each Sub-Score (S<sub>i</sub>) ranges from <strong>0.0</strong> (Extreme Isolation) to <strong>100.0</strong> (High Access).
        </div>
      </div>

      <!-- 7 Pillars Weight Grid -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; font-size: 0.8rem">
        <div style="background: rgba(0,0,0,0.3); padding: 0.85rem; border-radius: 10px; border-left: 3px solid #38bdf8">
          <div style="font-weight: 700; color: #fff; margin-bottom: 0.2rem">🏙️ 1. Urban Hub (20%)</div>
          <div style="color: var(--text-muted); font-size: 0.74rem">Evaluates travel time ($T_{\\text{urban}}$) to nearest urban job & college centre.</div>
        </div>

        <div style="background: rgba(0,0,0,0.3); padding: 0.85rem; border-radius: 10px; border-left: 3px solid #10b981">
          <div style="font-weight: 700; color: #fff; margin-bottom: 0.2rem">🛠️ 2. Road Condition (18%)</div>
          <div style="color: var(--text-muted); font-size: 0.74rem">Penalizes Kutcha mud tracks & monsoon cut-off days (75–100d/yr).</div>
        </div>

        <div style="background: rgba(0,0,0,0.3); padding: 0.85rem; border-radius: 10px; border-left: 3px solid #f59e0b">
          <div style="font-weight: 700; color: #fff; margin-bottom: 0.2rem">🛣️ 3. Highway Dist (15%)</div>
          <div style="color: var(--text-muted); font-size: 0.74rem">Length of unpaved feeder track connecting to state highway.</div>
        </div>

        <div style="background: rgba(0,0,0,0.3); padding: 0.85rem; border-radius: 10px; border-left: 3px solid #f43f5e">
          <div style="font-weight: 700; color: #fff; margin-bottom: 0.2rem">🏥 4. Healthcare (16%)</div>
          <div style="color: var(--text-muted); font-size: 0.74rem">Emergency hospital ICU transit minutes + Health Sub-Center availability.</div>
        </div>

        <div style="background: rgba(0,0,0,0.3); padding: 0.85rem; border-radius: 10px; border-left: 3px solid #c084fc">
          <div style="font-weight: 700; color: #fff; margin-bottom: 0.2rem">🏫 5. Education (11%)</div>
          <div style="color: var(--text-muted); font-size: 0.74rem">Secondary school availability & transit to technical colleges.</div>
        </div>

        <div style="background: rgba(0,0,0,0.3); padding: 0.85rem; border-radius: 10px; border-left: 3px solid #fbbf24">
          <div style="font-weight: 700; color: #fff; margin-bottom: 0.2rem">🌾 6. APMC Mandi (12%)</div>
          <div style="color: var(--text-muted); font-size: 0.74rem">Mandi travel time & perishable produce spoilage penalty.</div>
        </div>

        <div style="background: rgba(0,0,0,0.3); padding: 0.85rem; border-radius: 10px; border-left: 3px solid #38bdf8; grid-column: span 2">
          <div style="font-weight: 700; color: #fff; margin-bottom: 0.2rem">🚌 7. KSRTC Public Transit (8%)</div>
          <div style="color: var(--text-muted); font-size: 0.74rem">Daily KSRTC Gramina Sarige bus frequency & walk distance to nearest bus stop.</div>
        </div>
      </div>
    </div>
  `;
}

function renderCasTableBody(villages, onInspectVillage) {
  const tableBody = document.getElementById('casTableBody');
  if (!tableBody) return;

  if (villages.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 3rem; color: var(--text-muted)">
          No villages match your current filters.
        </td>
      </tr>
    `;
    return;
  }

  const sorted = [...villages].sort((a, b) => {
    const casA = a.metrics.accessibility || { current: 0, projected: 0, gain: 0 };
    const casB = b.metrics.accessibility || { current: 0, projected: 0, gain: 0 };

    let valA, valB;
    if (casSortField === 'casCurrent') { valA = casA.current; valB = casB.current; }
    else if (casSortField === 'casProjected') { valA = casA.projected; valB = casB.projected; }
    else if (casSortField === 'casGain') { valA = casA.gain; valB = casB.gain; }
    else if (casSortField === 'population') { valA = a.population; valB = b.population; }
    else if (casSortField === 'name') { valA = a.name; valB = b.name; }

    if (valA < valB) return casSortDir === 'asc' ? -1 : 1;
    if (valA > valB) return casSortDir === 'asc' ? 1 : -1;
    return 0;
  });

  tableBody.innerHTML = sorted.map((v, index) => {
    const cas = v.metrics.accessibility || { current: 20, projected: 85, gain: 65 };
    const isSeverelyBad = v.roadConditionCategory === 'SEVERELY_BAD';

    let primaryDeficitDriver = 'Extreme Mud Track Isolation';
    if (!v.hasHealthCenter && cas.breakdown && cas.breakdown.health.pre < 25) {
      primaryDeficitDriver = 'Hospital ICU & Health Isolation';
    } else if (v.currentBusFrequencyPerDay === 0) {
      primaryDeficitDriver = 'Zero KSRTC Bus Connectivity';
    } else if (v.monsoonIsolationDays >= 80) {
      primaryDeficitDriver = `${v.monsoonIsolationDays} Days Monsoon Cut-Off`;
    }

    return `
      <tr>
        <td style="font-family: var(--font-mono); font-weight: 800; color: var(--accent-cyan); font-size: 0.95rem">
          #${index + 1}
        </td>
        <td>
          <div style="font-weight: 700; color: var(--text-primary); font-size: 0.95rem">${v.name}</div>
          <div style="font-size: 0.78rem; color: var(--text-secondary)">${v.district}, ${v.state}</div>
        </td>
        <td>
          <div style="font-size: 0.8rem; font-weight: 600; color: ${isSeverelyBad ? '#fb7185' : '#fbbf24'}">
            ${isSeverelyBad ? '🔴 Severely Bad' : '🟠 Bad Surface'}
          </div>
          <div style="font-size: 0.72rem; color: var(--text-muted)">${v.existingRoadType}</div>
        </td>
        <td>
          <div style="background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.4); padding: 0.4rem 0.75rem; border-radius: 8px; display: inline-block">
            <div style="font-family: var(--font-mono); font-size: 1.05rem; font-weight: 800; color: #ef4444">
              ${cas.current} <span style="font-size: 0.7rem; color: var(--text-muted)">/ 100</span>
            </div>
            <div style="font-size: 0.7rem; color: #fca5a5">Critical Deficit</div>
          </div>
        </td>
        <td>
          <div style="background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.4); padding: 0.4rem 0.75rem; border-radius: 8px; display: inline-block">
            <div style="font-family: var(--font-mono); font-size: 1.05rem; font-weight: 800; color: var(--accent-emerald)">
              ${cas.projected} <span style="font-size: 0.7rem; color: var(--text-muted)">/ 100</span>
            </div>
            <div style="font-size: 0.7rem; color: #6ee7b7">High Access</div>
          </div>
        </td>
        <td>
          <div style="font-family: var(--font-mono); font-size: 1.1rem; font-weight: 800; color: var(--accent-cyan)">
            +${cas.gain} pts
          </div>
          <div style="font-size: 0.72rem; color: var(--accent-emerald)">
            +${((cas.gain / (100 - cas.current)) * 100).toFixed(0)}% resolved
          </div>
        </td>
        <td>
          <div style="font-size: 0.8rem; color: #e2e8f0; font-weight: 600">
            ${primaryDeficitDriver}
          </div>
          <div style="font-size: 0.72rem; color: var(--text-muted)">
            Pop: ${v.population.toLocaleString()} • Mandi: ${v.currentTravelTimeMin}m
          </div>
        </td>
        <td>
          <button class="btn-inspect btn-cas-inspect" data-id="${v.id}">Inspect CAS Matrix ➔</button>
        </td>
      </tr>
    `;
  }).join('');

  tableBody.querySelectorAll('.btn-cas-inspect').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const vId = e.currentTarget.getAttribute('data-id');
      const village = villages.find(item => item.id === vId);
      if (village && onInspectVillage) {
        onInspectVillage(village);
      }
    });
  });
}

function setupCasSorting(villages, onInspectVillage) {
  const headers = document.querySelectorAll('#casTable th[data-cas-sort]');
  headers.forEach(th => {
    th.addEventListener('click', () => {
      const field = th.getAttribute('data-cas-sort');
      if (casSortField === field) {
        casSortDir = casSortDir === 'asc' ? 'desc' : 'asc';
      } else {
        casSortField = field;
        casSortDir = field === 'casCurrent' ? 'asc' : 'desc';
      }
      renderCasTableBody(villages, onInspectVillage);
    });
  });
}

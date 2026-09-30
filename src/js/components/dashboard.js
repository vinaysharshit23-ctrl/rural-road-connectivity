/**
 * Dashboard KPI Header Component
 * Computes high-level aggregated metrics across all evaluated Karnataka villages.
 */

export function renderDashboardKPIs(villages) {
  const container = document.getElementById('kpiContainer');
  if (!container) return;

  const totalVillages = villages.length;
  const totalPop = villages.reduce((acc, v) => acc + v.population, 0);

  const avgAccessPre = villages.length > 0
    ? (villages.reduce((acc, v) => acc + (v.metrics.accessibility ? v.metrics.accessibility.current : 25), 0) / villages.length).toFixed(1)
    : 0;

  const avgAccessPost = villages.length > 0
    ? (villages.reduce((acc, v) => acc + (v.metrics.accessibility ? v.metrics.accessibility.projected : 85), 0) / villages.length).toFixed(1)
    : 0;

  const avgAccessGain = (avgAccessPost - avgAccessPre).toFixed(1);

  const maxRoi = villages.length > 0
    ? Math.max(...villages.map(v => v.metrics.roiPerCrore)).toFixed(2)
    : 0;

  const zeroBusVillages = villages.filter(v => (v.metrics.currentBusFreq || 0) === 0).length;
  const totalBusTripsGained = villages.reduce((acc, v) => acc + (v.metrics.busFreqGain || 0), 0);

  const severelyBadCount = villages.filter(v => v.roadConditionCategory === 'SEVERELY_BAD').length;
  const districtsCount = new Set(villages.map(v => v.district)).size;

  container.innerHTML = `
    <div class="kpi-card">
      <div class="kpi-header">
        <span class="kpi-title">UNCONNECTED VILLAGES</span>
        <span class="kpi-icon">🏡</span>
      </div>
      <div class="kpi-value">${totalVillages}</div>
      <div class="kpi-subtext">Across ${districtsCount} Karnataka Districts • ${severelyBadCount} Severely Bad</div>
    </div>

    <div class="kpi-card">
      <div class="kpi-header">
        <span class="kpi-title">AVG ACCESSIBILITY SCORE</span>
        <span class="kpi-icon">🎯</span>
      </div>
      <div class="kpi-value" style="color: #ef4444">${avgAccessPre} <span style="font-size: 0.9rem; color: var(--text-muted)">/ 100</span></div>
      <div class="kpi-subtext" style="color: var(--accent-emerald)">➔ ${avgAccessPost} post-road (+${avgAccessGain} pts boost)</div>
    </div>

    <div class="kpi-card">
      <div class="kpi-header">
        <span class="kpi-title">KSRTC BUS ACCESS GAIN</span>
        <span class="kpi-icon">🚌</span>
      </div>
      <div class="kpi-value">+${totalBusTripsGained} <span style="font-size: 1rem">trips/day</span></div>
      <div class="kpi-subtext">${zeroBusVillages} villages currently have ZERO bus access</div>
    </div>

    <div class="kpi-card">
      <div class="kpi-header">
        <span class="kpi-title">MAX 10-YR ROI MULTIPLIER</span>
        <span class="kpi-icon">📈</span>
      </div>
      <div class="kpi-value">${maxRoi}x</div>
      <div class="kpi-subtext">Economic return per ₹ Crore invested</div>
    </div>
  `;
}

/**
 * Dashboard KPI Header Component
 * Computes high-level aggregated metrics across all evaluated Karnataka villages.
 */

export function renderDashboardKPIs(villages) {
  const container = document.getElementById('kpiContainer');

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

  const avgRoi = villages.length > 0
    ? (villages.reduce((acc, v) => acc + v.metrics.roiPerCrore, 0) / villages.length).toFixed(2)
    : 0;

  const zeroBusVillages = villages.filter(v => (v.metrics.currentBusFreq || 0) === 0).length;
  const totalBusTripsGained = villages.reduce((acc, v) => acc + (v.metrics.busFreqGain || 0), 0);

  const severelyBadCount = villages.filter(v => v.roadConditionCategory === 'SEVERELY_BAD').length;
  const districtsCount = new Set(villages.map(v => v.district)).size;

  // Real aggregate computations for homepage DeFi cards
  const avgMandiSavedMin = villages.length > 0
    ? Math.round(villages.reduce((sum, v) => sum + (v.currentTravelTimeMin - v.postRoadTravelTimeMin), 0) / villages.length)
    : 0;
  
  const avgMandiPercentGain = villages.length > 0
    ? Math.round(villages.reduce((sum, v) => sum + (v.metrics.timeSavedPercent || 0), 0) / villages.length)
    : 0;

  const total10YrWealthCr = villages.length > 0
    ? (villages.reduce((sum, v) => sum + (v.metrics.tenYearBenefitLakhs || 0), 0) / 100).toFixed(1)
    : 0;

  const avgPostHospMin = villages.length > 0
    ? (villages.reduce((sum, v) => sum + (v.postHospitalTravelTimeMin || 30), 0) / villages.length).toFixed(1)
    : 0;

  const avgMonsoonIsolation = villages.length > 0
    ? Math.round(villages.reduce((sum, v) => sum + (v.monsoonIsolationDays || 0), 0) / villages.length)
    : 0;

  const totalDailyCommutersK = (totalPop * 0.45 / 1000).toFixed(1);

  // Update Top DeFi Widgets if present on the page
  const widgetMandiVal = document.getElementById('defiWidgetMandiVal');
  const widgetMandiPill = document.getElementById('defiWidgetMandiPill');
  const widgetRoiVal = document.getElementById('defiWidgetRoiVal');
  const widgetRoiPill = document.getElementById('defiWidgetRoiPill');
  const widgetHealthVal = document.getElementById('defiWidgetHealthVal');
  const widgetHealthDesc = document.getElementById('defiWidgetHealthDesc');
  const widgetBusVal = document.getElementById('defiWidgetBusVal');

  if (widgetMandiVal) widgetMandiVal.textContent = `${avgMandiSavedMin} MIN`;
  if (widgetMandiPill) widgetMandiPill.textContent = `▲ +${avgMandiPercentGain}% Faster`;
  if (widgetRoiVal) widgetRoiVal.textContent = `₹${total10YrWealthCr} CR`;
  if (widgetRoiPill) widgetRoiPill.textContent = `${avgRoi}x Avg Multiple`;
  if (widgetHealthVal) widgetHealthVal.textContent = `${avgPostHospMin} MIN`;
  if (widgetHealthDesc) widgetHealthDesc.textContent = `Slashing average ${avgMonsoonIsolation}-day monsoon ambulance cutoff to zero.`;
  if (widgetBusVal) widgetBusVal.textContent = `${totalDailyCommutersK}K`;

  if (container) {
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
}


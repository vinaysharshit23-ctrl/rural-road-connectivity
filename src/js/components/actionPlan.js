/**
 * Recommended Actions Component
 * Turns the platform's data scores into concrete, actionable directives for planners.
 * Each village gets a priority tier, specific action items, budget estimate, and timeline.
 *
 * Priority is determined by a composite urgency score combining:
 *   - CAS baseline (how isolated right now) — 35%
 *   - MAI score (market value locked away) — 30%
 *   - ROI per crore (cost efficiency) — 20%
 *   - Monsoon isolation days (safety urgency) — 15%
 */

let actionSortField = 'urgency';
let actionSortDir = 'desc';

export function renderActionPlanView(villages, onInspectVillage) {
  renderActionSummary(villages);
  renderActionTable(villages, onInspectVillage);
}

/* ── Compute a composite urgency score and assign action directives ── */
function buildActionPlan(villages) {
  return villages.map(v => {
    const m = v.metrics || {};
    const cas = m.accessibility || { current: 50, projected: 85, gain: 35 };

    // Composite urgency: lower CAS = more isolated = more urgent
    // Higher MAI = more market value locked = more urgent
    // Higher ROI = more cost-efficient = more urgent
    // More monsoon isolation days = more urgent
    const casComponent = (100 - cas.current) / 100 * 35;       // 0-35
    const maiComponent = (m.maiScore || 0) / 100 * 30;          // 0-30
    const roiComponent = Math.min(100, m.roiPerCrore || 0) / 100 * 20; // 0-20
    const isolationComponent = Math.min(120, v.monsoonIsolationDays || 0) / 120 * 15; // 0-15

    const urgency = parseFloat((casComponent + maiComponent + roiComponent + isolationComponent).toFixed(1));

    // Priority tier
    let tier, tierColor, tierLabel, tierBg;
    if (urgency >= 65) {
      tier = 'CRITICAL'; tierColor = '#E8533A'; tierLabel = '🔴 CRITICAL — Connect Immediately'; tierBg = '#FFF3F0';
    } else if (urgency >= 45) {
      tier = 'HIGH'; tierColor = '#C08000'; tierLabel = '🟠 HIGH — Priority Phase 1'; tierBg = '#FFFBF0';
    } else if (urgency >= 30) {
      tier = 'MODERATE'; tierColor = '#2A6B50'; tierLabel = '🟢 MODERATE — Phase 2'; tierBg = '#F0F8F4';
    } else {
      tier = 'LOW'; tierColor = '#5A5650'; tierLabel = '⚪ LOW — Phase 3 (Monitor)'; tierBg = '#EFEFEB';
    }

    // Generate specific action items based on the village's deficits
    const actions = generateActions(v, m, cas);

    // Budget phasing
    const costCr = (v.estCostLakhs / 100).toFixed(2);
    const phase = tier === 'CRITICAL' ? 'Phase 1 (Year 1)' : tier === 'HIGH' ? 'Phase 1 (Year 1-2)' : tier === 'MODERATE' ? 'Phase 2 (Year 2-3)' : 'Phase 3 (Year 3+)';

    return {
      ...v,
      urgency,
      tier,
      tierColor,
      tierLabel,
      tierBg,
      actions,
      phase,
      costCr
    };
  }).sort((a, b) => b.urgency - a.urgency);
}

/* ── Generate village-specific action items from data deficits ── */
function generateActions(v, m, cas) {
  const actions = [];

  // Road construction action
  actions.push({
    icon: '🛣️',
    title: `Construct ${v.roadLengthKm} km all-weather bitumen road`,
    detail: `Replace "${v.existingRoadType}" with paved PMGSY-III standard road connecting to nearest highway junction.`,
    metric: `Est. cost: ₹${v.estCostLakhs.toFixed(1)} Lakhs (₹${(v.estCostLakhs / 100).toFixed(2)} Cr)`,
    priority: 'PRIMARY'
  });

  // Monsoon isolation action
  if (v.monsoonIsolationDays >= 60) {
    actions.push({
      icon: '🌧️',
      title: `Resolve ${v.monsoonIsolationDays}-day monsoon cut-off`,
      detail: `Priority culvert & cross-drainage work needed — village is fully isolated for ${v.monsoonIsolationDays} days/year. All-weather surface will eliminate seasonal cutoff entirely.`,
      metric: `Isolation drops to 0 days post-construction`,
      priority: 'CRITICAL'
    });
  }

  // Healthcare action
  const healthScore = cas.breakdown?.health?.pre || 0;
  if (!v.hasHealthCenter || healthScore < 25) {
    actions.push({
      icon: '🏥',
      title: `Restore emergency hospital access`,
      detail: `Nearest hospital: ${v.nearestHospitalHub} (${v.hospitalDistKm} km). Current travel: ${v.currentHospitalTravelTimeMin || Math.round(v.currentTravelTimeMin * 1.1)} min. Post-road: ${v.postHospitalTravelTimeMin || Math.round(v.postRoadTravelTimeMin * 1.15)} min. ${!v.hasHealthCenter ? 'No health sub-center in village.' : ''}`,
      metric: `Emergency transit: ${v.currentHospitalTravelTimeMin || Math.round(v.currentTravelTimeMin * 1.1)} → ${v.postHospitalTravelTimeMin || Math.round(v.postRoadTravelTimeMin * 1.15)} min`,
      priority: 'CRITICAL'
    });
  }

  // Market access action
  const cropValueLakhs = (v.annualAgriYieldTons * v.avgAgriValuePerTon) / 100000;
  if (m.maiScore > 40 || v.currentTravelTimeMin > 90) {
    actions.push({
      icon: '🌾',
      title: `Unlock APMC market access for ${v.primaryCrop}`,
      detail: `Nearest mandi: ${v.nearestMarket}. Current travel: ${v.currentTravelTimeMin} min → Post-road: ${v.postRoadTravelTimeMin} min. Annual crop value at risk: ₹${(cropValueLakhs * getCropPerishability(v.primaryCrop)).toFixed(1)} Lakhs in spoilage losses.`,
      metric: `Crop value: ₹${cropValueLakhs.toFixed(1)}L/yr • Market travel: ${v.currentTravelTimeMin}→${v.postRoadTravelTimeMin} min`,
      priority: v.maiScore > 60 ? 'CRITICAL' : 'HIGH'
    });
  }

  // Bus connectivity action
  if (v.currentBusFrequencyPerDay === 0) {
    actions.push({
      icon: '🚌',
      title: `Establish KSRTC Gramina Sarige bus service`,
      detail: `Village currently has ZERO bus connectivity. Post-road: minimum 2 daily Gramina Sarige trips per PMGSY/Karnataka GO norm. Walking distance to nearest stop: ${v.walkToBusStopKm} km.`,
      metric: `Bus freq: 0 → 2+ trips/day • Walk: ${v.walkToBusStopKm} km → 0 km`,
      priority: 'HIGH'
    });
  }

  // Education action
  if (!v.hasSecondarySchool) {
    actions.push({
      icon: '🏫',
      title: `Restore secondary school access`,
      detail: `No secondary school in village. Students must travel to ${v.nearestUrbanHub}. Post-road commute: ${v.postUrbanTravelTimeMin || Math.round(v.postRoadTravelTimeMin * 1.3)} min instead of ${v.currentUrbanTravelTimeMin || Math.round(v.currentTravelTimeMin * 1.2)} min.`,
      metric: `School commute: ${v.currentUrbanTravelTimeMin || Math.round(v.currentTravelTimeMin * 1.2)} → ${v.postUrbanTravelTimeMin || Math.round(v.postRoadTravelTimeMin * 1.3)} min`,
      priority: 'HIGH'
    });
  }

  // ROI action
  if ((m.roiPerCrore || 0) > 3) {
    actions.push({
      icon: '💰',
      title: `High economic return — prioritize funding`,
      detail: `10-year ROI: ₹${m.roiPerCrore?.toFixed(1) || '0'} per ₹1 Cr invested. Annual economic value created: ₹${m.totalAnnualEconomicValueLakhs?.toFixed(1) || '0'} Lakhs (crop savings + healthcare + transport + jobs).`,
      metric: `10-yr ROI: ₹${m.roiPerCrore?.toFixed(1) || '0'} per ₹Cr • Annual benefit: ₹${m.totalAnnualEconomicValueLakhs?.toFixed(1) || '0'}L`,
      priority: 'INFO'
    });
  }

  return actions;
}

/* Helper: match the ICAR perishability lookup from indexCalculator */
function getCropPerishability(cropName) {
  if (!cropName) return 0.25;
  const c = cropName.toLowerCase();
  if (/tomato|banana|marigold|mango|grape|nimbu|lemon|vanilla|ginger|cardamom/.test(c)) return 0.55;
  if (/pomegranate|coconut|tender coconut|pepper|cocoa|rubber|silk|cocoon/.test(c)) return 0.35;
  if (/coffee|arecanut|areca|sugarcane/.test(c)) return 0.22;
  if (/groundnut|sunflower|soybean|toor|tur|red gram|cotton|jowar|maize|ragi/.test(c)) return 0.10;
  if (/paddy|rice|copra|tamarind|turmeric|sandalwood/.test(c)) return 0.06;
  return 0.20;
}

/* ── Summary cards at the top of the Actions tab ── */
function renderActionSummary(villages) {
  const container = document.getElementById('actionSummaryContainer');
  if (!container) return;

  const plan = buildActionPlan(villages);
  const critical = plan.filter(v => v.tier === 'CRITICAL').length;
  const high = plan.filter(v => v.tier === 'HIGH').length;
  const moderate = plan.filter(v => v.tier === 'MODERATE').length;
  const totalCostCr = plan.filter(v => v.tier === 'CRITICAL' || v.tier === 'HIGH').reduce((sum, v) => sum + parseFloat(v.costCr), 0);
  const totalBenefitLakhs = plan.filter(v => v.tier === 'CRITICAL' || v.tier === 'HIGH').reduce((sum, v) => sum + (v.metrics?.totalAnnualEconomicValueLakhs || 0), 0);

  container.innerHTML = `
    <div style="margin-bottom: 1.5rem;">
      <div style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; color: var(--text-2); letter-spacing: 0.1em; margin-bottom: 0.2rem; border-left: 3px solid var(--coral); padding-left: 0.6rem;">
        🎯 Planner Action Brief
      </div>
      <h2 style="font-family: var(--font-display); font-size: 1.8rem; letter-spacing: 0.03em; text-transform: uppercase; color: var(--ink); margin-top: 0.35rem;">
        Recommended Actions & Priority Directives
      </h2>
      <p style="font-size: 0.85rem; color: var(--text-2); margin-top: 0.4rem; max-width: 720px;">
        This tab translates the platform's data scores into concrete, actionable directives.
        Each village is assigned a priority tier based on composite urgency (CAS isolation + MAI market value + ROI efficiency + monsoon safety).
        Planners can use this to decide <strong>what to build, in what order, and why</strong>.
      </p>
    </div>

    <!-- Summary Stat Cards -->
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; border: 2px solid var(--border); margin-bottom: 1.5rem;">
      <div style="padding: 1.1rem 1.2rem; border-right: 2px solid var(--border); background: #FFF3F0;">
        <div style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: var(--coral); letter-spacing: 0.08em;">🔴 Critical Priority</div>
        <div style="font-family: var(--font-display); font-size: 2.2rem; color: var(--coral); letter-spacing: 0.03em; margin-top: 0.15rem;">${critical}</div>
        <div style="font-size: 0.74rem; color: var(--text-2);">Villages needing immediate road construction</div>
      </div>
      <div style="padding: 1.1rem 1.2rem; border-right: 2px solid var(--border); background: #FFFBF0;">
        <div style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: var(--accent-amber); letter-spacing: 0.08em;">🟠 High Priority</div>
        <div style="font-family: var(--font-display); font-size: 2.2rem; color: var(--accent-amber); letter-spacing: 0.03em; margin-top: 0.15rem;">${high}</div>
        <div style="font-size: 0.74rem; color: var(--text-2);">Phase 1 candidates (Year 1-2)</div>
      </div>
      <div style="padding: 1.1rem 1.2rem; border-right: 2px solid var(--border);">
        <div style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: var(--accent-emerald); letter-spacing: 0.08em;">💰 Phase 1 Budget</div>
        <div style="font-family: var(--font-display); font-size: 1.6rem; color: var(--ink); letter-spacing: 0.03em; margin-top: 0.15rem;">₹${totalCostCr.toFixed(1)} Cr</div>
        <div style="font-size: 0.74rem; color: var(--text-2);">Total cost for Critical + High</div>
      </div>
      <div style="padding: 1.1rem 1.2rem;">
        <div style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: var(--accent-emerald); letter-spacing: 0.08em;">📈 Annual Return</div>
        <div style="font-family: var(--font-display); font-size: 1.6rem; color: var(--accent-emerald); letter-spacing: 0.03em; margin-top: 0.15rem;">₹${totalBenefitLakhs.toFixed(0)} L</div>
        <div style="font-size: 0.74rem; color: var(--text-2);">Economic value/yr from Phase 1</div>
      </div>
    </div>
  `;
}

/* ── Main action plan table with expandable action cards ── */
function renderActionTable(villages, onInspectVillage) {
  const container = document.getElementById('actionTableContainer');
  if (!container) return;

  const plan = buildActionPlan(villages);

  if (plan.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem; color: var(--text-muted); border: 2px solid var(--border); background: #fff;">
        No villages match your current filters.
      </div>
    `;
    return;
  }

  container.innerHTML = plan.map((v, index) => {
    const priorityBadges = v.actions.map(a => {
      const colors = {
        'CRITICAL': { bg: '#FFE8E3', border: '#E8533A', text: '#E8533A' },
        'HIGH': { bg: '#FFF3D6', border: '#C08000', text: '#C08000' },
        'PRIMARY': { bg: '#E8F0FE', border: '#1A1A1A', text: '#1A1A1A' },
        'INFO': { bg: '#E8F5E9', border: '#2A6B50', text: '#2A6B50' }
      };
      const c = colors[a.priority] || colors['INFO'];
      return `<span style="background:${c.bg};border:1px solid ${c.border};color:${c.text};font-size:0.66rem;font-weight:700;padding:0.15rem 0.45rem;border-radius:4px;text-transform:uppercase;letter-spacing:0.04em;">${a.icon} ${a.priority}</span>`;
    }).join(' ');

    const actionCards = v.actions.map(a => {
      const pColors = {
        'CRITICAL': '#E8533A',
        'HIGH': '#C08000',
        'PRIMARY': '#1A1A1A',
        'INFO': '#2A6B50'
      };
      const accent = pColors[a.priority] || '#5A5650';

      return `
        <div style="display:flex;gap:0.85rem;padding:0.85rem 0;background:#fff;border-bottom:1px solid var(--border-soft);">
          <div style="font-size:1.4rem;flex-shrink:0;line-height:1.2;">${a.icon}</div>
          <div style="flex:1;">
            <div style="font-size:0.86rem;font-weight:700;color:var(--ink);margin-bottom:0.15rem;">${a.title}</div>
            <div style="font-size:0.78rem;color:var(--text-2);line-height:1.45;margin-bottom:0.35rem;">${a.detail}</div>
            <div style="font-size:0.74rem;font-family:var(--font-mono);color:${accent};font-weight:600;background:#F5F2EC;padding:0.2rem 0.5rem;border-radius:4px;display:inline-block;">${a.metric}</div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div style="background:#fff;border:2px solid var(--border);margin-bottom:1rem;overflow:hidden;">
        <!-- Village header row -->
        <div style="display:flex;align-items:center;gap:1rem;padding:0.85rem 1.2rem;background:${v.tierBg};border-bottom:2px solid var(--border);">
          <div style="font-family:var(--font-display);font-size:1.8rem;color:${v.tierColor};font-weight:700;flex-shrink:0;width:2.5rem;">#${index + 1}</div>
          <div style="flex:1;">
            <div style="font-size:1.05rem;font-weight:800;color:var(--ink);">${v.name}</div>
            <div style="font-size:0.78rem;color:var(--text-2);">${v.district}, ${v.state} • Pop: ${v.population.toLocaleString()} • ${v.phase}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:${v.tierColor};">${v.tierLabel}</div>
            <div style="font-family:var(--font-mono);font-size:1.1rem;font-weight:800;color:var(--ink);margin-top:0.15rem;">Urgency: ${v.urgency}<span style="font-size:0.7rem;color:var(--text-2);">/100</span></div>
          </div>
        </div>

        <!-- Score strip -->
        <div style="display:flex;gap:0;border-bottom:2px solid var(--border);">
          <div style="flex:1;padding:0.6rem 1.2rem;border-right:1px solid var(--border-soft);">
            <div style="font-size:0.66rem;font-weight:700;text-transform:uppercase;color:var(--text-3);letter-spacing:0.06em;">CAS Baseline</div>
            <div style="font-family:var(--font-mono);font-size:1rem;font-weight:800;color:#ef4444;">${v.metrics?.accessibility?.current || '—'}/100</div>
          </div>
          <div style="flex:1;padding:0.6rem 1.2rem;border-right:1px solid var(--border-soft);">
            <div style="font-size:0.66rem;font-weight:700;text-transform:uppercase;color:var(--text-3);letter-spacing:0.06em;">MAI Score</div>
            <div style="font-family:var(--font-mono);font-size:1rem;font-weight:800;color:var(--coral);">${v.metrics?.maiScore || '—'}</div>
          </div>
          <div style="flex:1;padding:0.6rem 1.2rem;border-right:1px solid var(--border-soft);">
            <div style="font-size:0.66rem;font-weight:700;text-transform:uppercase;color:var(--text-3);letter-spacing:0.06em;">ROI / ₹Cr</div>
            <div style="font-family:var(--font-mono);font-size:1rem;font-weight:800;color:var(--accent-emerald);">₹${v.metrics?.roiPerCrore?.toFixed(1) || '—'}</div>
          </div>
          <div style="flex:1;padding:0.6rem 1.2rem;border-right:1px solid var(--border-soft);">
            <div style="font-size:0.66rem;font-weight:700;text-transform:uppercase;color:var(--text-3);letter-spacing:0.06em;">Monsoon Cutoff</div>
            <div style="font-family:var(--font-mono);font-size:1rem;font-weight:800;color:var(--accent-amber);">${v.monsoonIsolationDays} days</div>
          </div>
          <div style="flex:1;padding:0.6rem 1.2rem;">
            <div style="font-size:0.66rem;font-weight:700;text-transform:uppercase;color:var(--text-3);letter-spacing:0.06em;">Est. Cost</div>
            <div style="font-family:var(--font-mono);font-size:1rem;font-weight:800;color:var(--ink);">₹${v.estCostLakhs.toFixed(0)}L</div>
          </div>
        </div>

        <!-- Action items -->
        <div style="padding:0 1.2rem;">
          <div style="display:flex;gap:0.4rem;flex-wrap:wrap;padding:0.6rem 0;border-bottom:1px solid var(--border-soft);">
            ${priorityBadges}
          </div>
          ${actionCards}
        </div>

        <!-- Action buttons -->
        <div style="display:flex;gap:0.6rem;padding:0.85rem 1.2rem;border-top:2px solid var(--border);background:var(--bg-card2);">
          <button class="atrium-btn" style="font-size:0.78rem;padding:0.4rem 0.85rem;" onclick="window.__inspectVillage('${v.id}')">
            📋 Inspect Village
          </button>
          <button class="atrium-link" style="font-size:0.78rem;padding:0.4rem 0.85rem;" onclick="document.getElementById('navMapBtn').click();window.__inspectVillage('${v.id}')">
            🗺️ View on Map
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Wire up inspect buttons
  window.__inspectVillage = (villageId) => {
    const village = villages.find(v => v.id === villageId);
    if (village) onInspectVillage(village);
  };
}

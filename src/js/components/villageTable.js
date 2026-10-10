/**
 * Village Table Component
 * Dynamic, sortable, and searchable ranking table for unconnected villages.
 * Includes explicit Road Condition Categories (Severely Bad, Bad), Mandi, Urban, & Healthcare access.
 */

let currentSortField = 'maiScore';
let currentSortDir = 'desc';

export function renderVillageTable(villages, onInspectVillage) {
  const tableBody = document.getElementById('villageTableBody');
  if (!tableBody) return;

  if (villages.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 3rem; color: var(--text-muted)">
          No villages match your current filter search. Try resetting filters.
        </td>
      </tr>
    `;
    return;
  }

  const sorted = [...villages].sort((a, b) => {
    let valA, valB;
    if (currentSortField === 'maiScore') { valA = a.metrics.maiScore; valB = b.metrics.maiScore; }
    else if (currentSortField === 'cas') { valA = a.metrics.accessibility ? a.metrics.accessibility.current : 0; valB = b.metrics.accessibility ? b.metrics.accessibility.current : 0; }
    else if (currentSortField === 'roi') { valA = a.metrics.roiPerCrore; valB = b.metrics.roiPerCrore; }
    else if (currentSortField === 'population') { valA = a.population; valB = b.population; }
    else if (currentSortField === 'cost') { valA = a.estCostLakhs; valB = b.estCostLakhs; }
    else if (currentSortField === 'timeSaved') { valA = a.metrics.timeSavedHrs; valB = b.metrics.timeSavedHrs; }
    else if (currentSortField === 'name') { valA = a.name; valB = b.name; }

    if (valA < valB) return currentSortDir === 'asc' ? -1 : 1;
    if (valA > valB) return currentSortDir === 'asc' ? 1 : -1;
    return 0;
  });

  tableBody.innerHTML = sorted.map((v, index) => {
    let badgeClass = 'mai-standard';
    if (v.metrics.maiScore >= 75) badgeClass = 'mai-high';
    else if (v.metrics.maiScore >= 50) badgeClass = 'mai-medium';

    // Road Condition Category Styling
    const isSeverelyBad = v.roadConditionCategory === 'SEVERELY_BAD';
    const conditionBg = isSeverelyBad ? 'rgba(244, 63, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)';
    const conditionBorder = isSeverelyBad ? 'rgba(244, 63, 94, 0.4)' : 'rgba(245, 158, 11, 0.4)';
    const conditionText = isSeverelyBad ? '#fb7185' : '#fbbf24';
    const conditionIcon = isSeverelyBad ? '🔴' : '🟠';
    const conditionTitle = isSeverelyBad ? 'Severely Bad' : 'Bad Surface';

    const cas = v.metrics.accessibility || { current: 20, projected: 85, gain: 65 };

    return `
      <tr>
        <td style="font-family: var(--font-mono); color: var(--text-muted); font-size: 0.8rem">#${index + 1}</td>
        <td>
          <div style="font-weight: 700; color: var(--text-primary); font-size: 0.95rem">${v.name}</div>
          <div style="font-size: 0.78rem; color: var(--text-secondary)">${v.district}, ${v.state}</div>
        </td>
        <td>
          <div style="background: ${conditionBg}; border: 1px solid ${conditionBorder}; color: ${conditionText}; padding: 0.3rem 0.6rem; border-radius: 6px; display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.78rem; font-weight: 600">
            <span>${conditionIcon}</span>
            <span>${conditionTitle}</span>
          </div>
          <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.2rem">
            ${v.existingRoadType} • Cut off ${v.monsoonIsolationDays}d/yr
          </div>
        </td>
        <td>
          <span class="badge ${badgeClass}">MAI: ${v.metrics.maiScore}</span>
        </td>
        <td>
          <div style="background: #FFF3F0; border: 2px solid #ef4444; padding: 0.35rem 0.6rem;">
            <div style="font-size: 0.85rem; font-weight: 700; color: #C03020;">
              ${cas.current} <span style="font-size: 0.72rem; color: var(--text-2);">/ 100</span>
            </div>
            <div style="font-size: 0.72rem; font-weight: 600; color: #2A6B50; margin-top: 0.1rem;">
              ➔ ${cas.projected} (+${cas.gain})
            </div>
          </div>
        </td>
        <td style="font-family: var(--font-mono)">${v.population.toLocaleString()}</td>
        <td>
          <div style="font-size: 0.82rem">
            <span style="color: var(--accent-rose)">${v.currentTravelTimeMin}m</span> ➔ 
            <span style="color: var(--accent-emerald)">${v.postRoadTravelTimeMin}m</span> (Market)
          </div>
          <div style="font-size: 0.75rem; color: var(--accent-cyan); margin-top: 0.15rem">
            💼 Urban Hub: <strong>-${v.metrics.urbanTimeSavedHrs} hrs</strong> saved
          </div>
          <div style="font-size: 0.75rem; color: #fbbf24; margin-top: 0.15rem">
            🚌 KSRTC Bus: <strong>${v.metrics.currentBusFreq} ➔ ${v.metrics.projBusFreq} buses/day</strong> (Walk: ${v.metrics.walkToBusStopKm}km)
          </div>
          <div style="font-size: 0.75rem; color: var(--accent-rose); margin-top: 0.15rem">
            🏥 Hospital ICU: <strong>-${v.metrics.hospitalTimeSavedHrs} hrs</strong> saved
          </div>
        </td>
        <td style="font-family: var(--font-mono)">₹${v.estCostLakhs} L</td>
        <td>
          <span class="roi-tag">${v.metrics.roiPerCrore}x</span>
          <div style="font-size: 0.72rem; color: var(--text-muted)">₹${v.metrics.totalAnnualEconomicValueLakhs}L / yr</div>
        </td>
        <td>
          <button class="btn-inspect" data-id="${v.id}">Inspect ➔</button>
        </td>
      </tr>
    `;
  }).join('');

  tableBody.querySelectorAll('.btn-inspect').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const vId = e.currentTarget.getAttribute('data-id');
      const village = villages.find(item => item.id === vId);
      if (village && onInspectVillage) {
        onInspectVillage(village);
      }
    });
  });
}

export function setupTableSorting(onSortChange) {
  const headers = document.querySelectorAll('.custom-table th[data-sort]');
  headers.forEach(th => {
    th.addEventListener('click', () => {
      const field = th.getAttribute('data-sort');
      if (currentSortField === field) {
        currentSortDir = currentSortDir === 'asc' ? 'desc' : 'asc';
      } else {
        currentSortField = field;
        currentSortDir = 'desc';
      }
      if (onSortChange) onSortChange();
    });
  });
}

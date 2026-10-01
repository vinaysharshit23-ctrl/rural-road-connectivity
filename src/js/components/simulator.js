/**
 * Simulator Component
 * Handles the Budget Allocation ROI Simulator & Custom Village ROI Calculator.
 */

import { optimizeBudgetAllocation } from '../engine/budgetOptimizer.js';
import { calculateVillageMetrics } from '../engine/indexCalculator.js';

export function setupBudgetSimulator(villages, onUpdateCallback) {
  const slider = document.getElementById('budgetSlider');
  const budgetValueDisplay = document.getElementById('budgetValueDisplay');
  const simResultsContainer = document.getElementById('simResultsContainer');

  if (!slider || !simResultsContainer) return;

  function runSimulation() {
    const budgetCrores = parseFloat(slider.value);
    const budgetLakhs = budgetCrores * 100;
    
    if (budgetValueDisplay) {
      budgetValueDisplay.textContent = `₹ ${budgetCrores} Crores`;
    }

    const res = optimizeBudgetAllocation(villages, budgetLakhs);

    simResultsContainer.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem">
        <div style="background: rgba(9,13,22,0.6); padding: 1rem; border-radius: 12px; border: 1px solid var(--border-glass)">
          <div style="font-size: 0.78rem; color: var(--text-muted)">Selected Funded Roads</div>
          <div style="font-size: 1.5rem; font-weight: 700; color: var(--accent-emerald)">${res.selectedVillages.length} Villages</div>
          <div style="font-size: 0.75rem; color: var(--text-secondary)">Out of ${villages.length} candidates</div>
        </div>

        <div style="background: rgba(9,13,22,0.6); padding: 1rem; border-radius: 12px; border: 1px solid var(--border-glass)">
          <div style="font-size: 0.78rem; color: var(--text-muted)">Connected Population</div>
          <div style="font-size: 1.5rem; font-weight: 700; color: var(--accent-cyan)">${res.totalPopulation.toLocaleString()}</div>
          <div style="font-size: 0.75rem; color: var(--text-secondary)">Avg ${res.avgTimeSavedMin} mins saved/trip</div>
        </div>
      </div>

      <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem">
          <span style="font-weight: 700; color: var(--accent-emerald)">10-Year Economic Benefit</span>
          <span style="font-family: var(--font-mono); font-size: 1.2rem; font-weight: 700; color: var(--accent-emerald)">₹ ${res.totalBenefitLakhs} Lakhs</span>
        </div>
        <div style="font-size: 0.8rem; color: var(--text-secondary)">
          🚀 <strong>+${res.benefitImprovementPct}% higher economic yield</strong> compared to traditional population-only project allocation!
        </div>
      </div>

      <h4 style="font-size: 0.9rem; margin-bottom: 0.75rem; color: var(--text-primary)">Funded Priority Road List:</h4>
      <div style="max-height: 220px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.5rem">
        ${res.selectedVillages.map(v => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.65rem 0.85rem; background: rgba(18,26,43,0.8); border-radius: 8px; font-size: 0.85rem">
            <div>
              <strong style="color: var(--text-primary)">${v.name}</strong> 
              <span style="color: var(--text-muted)">(${v.district})</span>
            </div>
            <div style="font-family: var(--font-mono); color: var(--accent-cyan)">
              ₹${v.estCostLakhs}L <span style="color: var(--accent-emerald); font-size: 0.78rem">(${v.metrics.roiPerCrore}x)</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  slider.addEventListener('input', runSimulation);
  runSimulation();
}

export function setupCustomVillageCalculator(onAddVillage) {
  const form = document.getElementById('customVillageForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('inputName').value;
    const district = document.getElementById('inputDistrict').value;
    const state = document.getElementById('inputState').value;
    const population = parseInt(document.getElementById('inputPop').value);
    const roadLengthKm = parseFloat(document.getElementById('inputLength').value);
    const estCostLakhs = parseFloat(document.getElementById('inputCost').value);
    const currentTravelTimeMin = parseInt(document.getElementById('inputCurrentTime').value);
    const postRoadTravelTimeMin = parseInt(document.getElementById('inputPostTime').value);
    const primaryCrop = document.getElementById('inputCrop').value;
    const annualAgriYieldTons = parseFloat(document.getElementById('inputYield').value);
    const perishablePercent = parseInt(document.getElementById('inputPerishable').value);
    const avgAgriValuePerTon = parseInt(document.getElementById('inputValuePerTon').value);
    const nearestMandi = document.getElementById('inputMandi').value;
    const hasHealthCenter = document.getElementById('inputHealth').checked;
    const hasSecondarySchool = document.getElementById('inputSchool').checked;

    const baseLat = 14.2 + (Math.random() - 0.5) * 3.0;
    const baseLng = 76.0 + (Math.random() - 0.5) * 3.0;

    const newVillage = {
      id: `VIL-CUST-${Date.now().toString().slice(-4)}`,
      name,
      district,
      state,
      population,
      existingRoadType: "Kutcha Track",
      roadConditionCategory: "SEVERELY_BAD",
      roadConditionLabel: "Severely Bad (Unpaved Mud Track)",
      monsoonIsolationDays: 60,
      maxCurrentSpeedKmh: 10,
      roadLengthKm,
      terrain: "Plains",
      estCostLakhs,
      currentTravelTimeMin,
      postRoadTravelTimeMin,
      primaryCrop,
      annualAgriYieldTons,
      perishablePercent,
      avgAgriValuePerTon,
      nearestMandi,
      nearestUrbanHub: `${district} Regional Hub`,
      nearestHospitalHub: `${district} District Hospital`,
      ksrtcDivision: `KSRTC ${district} Division`,
      currentBusFrequencyPerDay: 0,
      projectedBusFrequencyPerDay: 6,
      walkToBusStopKm: roadLengthKm,
      hasHealthCenter,
      hasSecondarySchool,
      coordinates: {
        x: Math.floor(Math.random() * 600) + 200,
        y: Math.floor(Math.random() * 400) + 200
      },
      lat: baseLat,
      lng: baseLng,
      junctionCoords: [baseLat + 0.015, baseLng - 0.012],
      mandiCoords: [baseLat + 0.025, baseLng + 0.028],
      urbanCoords: [baseLat + 0.045, baseLng + 0.035],
      hospitalCoords: [baseLat - 0.022, baseLng - 0.032],
      busCoords: [baseLat + 0.008, baseLng + 0.015]
    };

    newVillage.metrics = calculateVillageMetrics(newVillage);

    if (onAddVillage) {
      onAddVillage(newVillage);
    }

    form.reset();
    alert(`🎉 Added "${name}" into Connectivity Database! Market Access Index: ${newVillage.metrics.maiScore}`);
  });
}

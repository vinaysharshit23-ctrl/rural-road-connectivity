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
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2px; background: var(--border); margin-bottom: 1.5rem;">
        <div style="background: #fff; padding: 1rem;">
          <div style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-2);">Selected Funded Roads</div>
          <div style="font-family: var(--font-display); font-size: 2rem; color: var(--ink); letter-spacing: 0.02em;">${res.selectedVillages.length} Villages</div>
          <div style="font-size: 0.75rem; color: var(--text-2);">Out of ${villages.length} candidates</div>
        </div>
        <div style="background: #fff; padding: 1rem;">
          <div style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-2);">Connected Population</div>
          <div style="font-family: var(--font-display); font-size: 2rem; color: var(--coral); letter-spacing: 0.02em;">${res.totalPopulation.toLocaleString()}</div>
          <div style="font-size: 0.75rem; color: var(--text-2);">Avg ${res.avgTimeSavedMin} mins saved/trip</div>
        </div>
      </div>

      <div style="background: #F0F8F4; border: 2px solid #2A6B50; padding: 1.25rem; margin-bottom: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
          <span style="font-weight: 800; color: #2A6B50; font-size: 0.88rem; text-transform: uppercase; letter-spacing: 0.04em;">10-Year Economic Benefit</span>
          <span style="font-family: var(--font-display); font-size: 1.6rem; color: #2A6B50; letter-spacing: 0.03em;">₹ ${res.totalBenefitLakhs} Lakhs</span>
        </div>
        <div style="font-size: 0.8rem; color: var(--text-2);">
          🚀 <strong>+${res.benefitImprovementPct}% higher economic yield</strong> vs traditional population-only allocation
        </div>
      </div>

      <h4 style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.75rem; color: var(--text-2);">Funded Priority Road List:</h4>
      <div style="max-height: 220px; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; background: var(--border);">
        ${res.selectedVillages.map(v => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.65rem 0.85rem; background: #fff; font-size: 0.85rem;">
            <div>
              <strong style="color: var(--ink);">${v.name}</strong>
              <span style="color: var(--text-2);"> (${v.district})</span>
            </div>
            <div style="font-family: var(--font-mono); color: var(--ink); font-weight: 700;">
              ₹${v.estCostLakhs}L <span style="color: #2A6B50; font-size: 0.78rem;">(${v.metrics.roiPerCrore}x)</span>
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

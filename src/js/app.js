/**
 * Main Application Controller
 * Manages global application state, tab routing, destination toggles, state filters, and component wiring.
 * Supports Mandi Markets, Urban Job Hubs, District Emergency Hospitals AND Road Condition Categories.
 */

import { INITIAL_VILLAGES } from './data/villages.js';
import { enrichVillagesData } from './engine/indexCalculator.js';
import { renderDashboardKPIs } from './components/dashboard.js';
import { renderVillageTable, setupTableSorting } from './components/villageTable.js';
import { renderCasRankingView } from './components/casRanking.js';
import { initMapViewer, setMapDestinationMode, setSelectedVillageOnMap } from './components/mapViewer.js';
import { setupBudgetSimulator, setupCustomVillageCalculator } from './components/simulator.js';
import { openVillageModal, setupModalControls } from './components/modal.js';

let activeVillages = enrichVillagesData(INITIAL_VILLAGES);
let currentMapDestMode = 'ALL';

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  updateAllComponents();

  setupThemeSwitcher();
  setupNavigationTabs();
  setupDestinationToggles();
  setupSearchAndFilters();

  setupTableSorting(() => {
    renderVillageTable(filterVillages(), handleInspectVillage);
  });

  setupBudgetSimulator(activeVillages);
  setupCustomVillageCalculator((newVillage) => {
    activeVillages.unshift(newVillage);
    updateAllComponents();
  });

  setupModalControls();
}

function setupThemeSwitcher() {
  const themeBtns = document.querySelectorAll('[data-theme-btn]');
  themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const selectedTheme = btn.getAttribute('data-theme-btn');
      document.documentElement.setAttribute('data-theme', selectedTheme);
      
      themeBtns.forEach(b => {
        b.style.borderColor = 'transparent';
        b.classList.remove('active');
      });
      
      btn.style.borderColor = '#ffffff';
      btn.classList.add('active');
    });
  });
}

function updateAllComponents() {
  const filtered = filterVillages();

  renderDashboardKPIs(activeVillages);
  renderVillageTable(filtered, handleInspectVillage);
  renderCasRankingView(filtered, handleInspectVillage);
  initMapViewer(filtered, (selectedVillage) => {
    renderMapSidebar(selectedVillage);
  }, currentMapDestMode);

  if (filtered.length > 0) {
    renderMapSidebar(filtered[0]);
  }
}

function filterVillages() {
  const searchInput = document.getElementById('searchInput');
  const conditionFilter = document.getElementById('conditionFilter');
  const stateFilter = document.getElementById('stateFilter');
  const terrainFilter = document.getElementById('terrainFilter');

  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const selectedCondition = conditionFilter ? conditionFilter.value : 'ALL';
  const selectedState = stateFilter ? stateFilter.value : 'ALL';
  const selectedTerrain = terrainFilter ? terrainFilter.value : 'ALL';

  return activeVillages.filter(v => {
    const matchesSearch = query === '' || 
      v.name.toLowerCase().includes(query) ||
      v.district.toLowerCase().includes(query) ||
      v.state.toLowerCase().includes(query) ||
      v.existingRoadType.toLowerCase().includes(query) ||
      (v.roadConditionLabel && v.roadConditionLabel.toLowerCase().includes(query)) ||
      v.primaryCrop.toLowerCase().includes(query) ||
      v.nearestMandi.toLowerCase().includes(query) ||
      (v.nearestUrbanHub && v.nearestUrbanHub.toLowerCase().includes(query)) ||
      (v.nearestHospitalHub && v.nearestHospitalHub.toLowerCase().includes(query));

    const matchesCondition = selectedCondition === 'ALL' || v.roadConditionCategory === selectedCondition;
    const matchesState = selectedState === 'ALL' || v.state === selectedState;
    const matchesTerrain = selectedTerrain === 'ALL' || v.terrain === selectedTerrain;

    return matchesSearch && matchesCondition && matchesState && matchesTerrain;
  });
}

function setupSearchAndFilters() {
  const searchInput = document.getElementById('searchInput');
  const conditionFilter = document.getElementById('conditionFilter');
  const stateFilter = document.getElementById('stateFilter');
  const terrainFilter = document.getElementById('terrainFilter');

  const handleFilterChange = () => {
    const filtered = filterVillages();
    renderVillageTable(filtered, handleInspectVillage);
    initMapViewer(filtered, renderMapSidebar, currentMapDestMode);
  };

  if (searchInput) searchInput.addEventListener('input', handleFilterChange);
  if (conditionFilter) conditionFilter.addEventListener('change', handleFilterChange);
  if (stateFilter) stateFilter.addEventListener('change', handleFilterChange);
  if (terrainFilter) terrainFilter.addEventListener('change', handleFilterChange);
}

function setupDestinationToggles() {
  const btnAll = document.getElementById('destAllBtn');
  const btnMandi = document.getElementById('destMandiBtn');
  const btnUrban = document.getElementById('destUrbanBtn');
  const btnBus = document.getElementById('destBusBtn');
  const btnHospital = document.getElementById('destHospitalBtn');

  if (!btnAll || !btnMandi || !btnUrban || !btnHospital) return;

  const updateButtons = (activeBtn) => {
    [btnAll, btnMandi, btnUrban, btnBus, btnHospital].filter(Boolean).forEach(b => b.classList.remove('active'));
    activeBtn.classList.add('active');
  };

  btnAll.onclick = () => {
    currentMapDestMode = 'ALL';
    updateButtons(btnAll);
    setMapDestinationMode('ALL');
  };

  btnMandi.onclick = () => {
    currentMapDestMode = 'MANDI';
    updateButtons(btnMandi);
    setMapDestinationMode('MANDI');
  };

  btnUrban.onclick = () => {
    currentMapDestMode = 'URBAN';
    updateButtons(btnUrban);
    setMapDestinationMode('URBAN');
  };

  if (btnBus) {
    btnBus.onclick = () => {
      currentMapDestMode = 'BUS';
      updateButtons(btnBus);
      setMapDestinationMode('BUS');
    };
  }

  btnHospital.onclick = () => {
    currentMapDestMode = 'HOSPITAL';
    updateButtons(btnHospital);
    setMapDestinationMode('HOSPITAL');
  };
}

function setupNavigationTabs() {
  const tabs = document.querySelectorAll('.nav-tab[data-tab]');
  const views = document.querySelectorAll('.tab-view');

  const switchTab = (targetViewId) => {
    if (!targetViewId) return;

    tabs.forEach(t => {
      if (t.getAttribute('data-tab') === targetViewId) {
        t.classList.add('active');
      } else {
        t.classList.remove('active');
      }
    });

    views.forEach(v => v.classList.remove('active'));

    const targetView = document.getElementById(targetViewId);
    if (targetView) targetView.classList.add('active');

    if (targetViewId === 'tab-map') {
      setTimeout(() => {
        initMapViewer(filterVillages(), renderMapSidebar, currentMapDestMode);
      }, 50);
    }
  };

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      switchTab(tab.getAttribute('data-tab'));
    });
  });

  document.querySelectorAll('.cta-btn[data-target-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.getAttribute('data-target-tab'));
    });
  });
}

function handleInspectVillage(village) {
  openVillageModal(village);
  setSelectedVillageOnMap(village.id);
}

function renderMapSidebar(v) {
  const sidebarContainer = document.getElementById('mapSidebarContent');
  if (!sidebarContainer || !v) return;

  const m = v.metrics;
  const isSeverelyBad = v.roadConditionCategory === 'SEVERELY_BAD';
  const highwayDist = Math.max(0, (v.urbanHubDistKm - v.roadLengthKm)).toFixed(1);

  sidebarContainer.innerHTML = `
    <div class="village-name-head">${v.name}</div>
    <div class="village-location-sub">${v.district}, ${v.state}</div>

    <div style="background: ${isSeverelyBad ? 'rgba(244,63,94,0.12)' : 'rgba(245,158,11,0.12)'}; border: 1px solid ${isSeverelyBad ? 'rgba(244,63,94,0.35)' : 'rgba(245,158,11,0.35)'}; padding: 0.65rem 0.85rem; border-radius: 8px; margin-bottom: 0.85rem">
      <div style="font-size: 0.72rem; text-transform: uppercase; color: ${isSeverelyBad ? '#fb7185' : '#fbbf24'}">Existing Road Condition</div>
      <div style="font-size: 0.9rem; font-weight: 700; color: #fff; margin-top: 0.15rem">
        ${isSeverelyBad ? '≡ƒö┤ Severely Bad (Critical)' : '≡ƒƒá Bad Surface (Poor Gravel)'}
      </div>
      <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.1rem">
        ${v.existingRoadType} ΓÇó Cut off ${v.monsoonIsolationDays}d/yr
      </div>
    </div>

    <!-- Urban Road Route Breakdown Card -->
    <div style="background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 10px; padding: 0.75rem 0.85rem; margin-bottom: 1rem">
      <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--accent-cyan); display: flex; align-items: center; justify-content: space-between">
        <span>≡ƒÅÖ∩╕Å Urban Hub Access Route</span>
        <span style="font-size: 0.7rem; color: #cbd5e1">${v.urbanHubDistKm} km total</span>
      </div>
      <div style="font-size: 0.85rem; font-weight: 700; color: #fff; margin: 0.3rem 0 0.4rem">
        ${v.nearestUrbanHub}
      </div>

      <!-- Segment Visualizer -->
      <div style="display: flex; align-items: center; gap: 0.35rem; font-size: 0.72rem; background: rgba(15,23,42,0.6); padding: 0.45rem 0.6rem; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 0.4rem">
        <span style="color: ${isSeverelyBad ? '#ef4444' : '#f59e0b'}; font-weight: 700">≡ƒö┤ ${v.roadLengthKm}km bad track</span>
        <span style="color: var(--text-muted)">Γ₧ö</span>
        <span style="color: var(--accent-cyan); font-weight: 600">≡ƒîÉ ${highwayDist}km Highway</span>
      </div>

      <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.2rem">
        <span>Current Travel: <strong style="color: #ef4444">${v.currentUrbanTravelTimeMin} mins</strong></span>
        <span>Post-Road: <strong style="color: var(--accent-emerald)">${v.postUrbanTravelTimeMin} mins</strong></span>
      </div>
      <div style="font-size: 0.7rem; color: #94a3b8; margin-top: 0.35rem; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 0.35rem">
        ≡ƒÄ» <strong>Access to:</strong> ${v.primaryUrbanOpportunity}
      </div>
    </div>

    <div class="stat-row">
      <span class="stat-label">Population:</span>
      <span class="stat-val">${v.population.toLocaleString()}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Nearest APMC Mandi:</span>
      <span class="stat-val" style="font-size: 0.78rem">${v.nearestMandi}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Nearest Hospital:</span>
      <span class="stat-val" style="color: var(--accent-rose); font-size: 0.75rem">${v.nearestHospitalHub}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Emergency Transit Saved:</span>
      <span class="stat-val" style="color: var(--accent-rose)">-${m.hospitalTimeSavedHrs} hrs (${m.hospitalTimeSavedPercent}%)</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">10-Yr ROI Multiplier:</span>
      <span class="stat-val" style="color: var(--accent-emerald)">${m.roiPerCrore}x</span>
    </div>

    <button id="btnMapInspectModal" class="btn-primary" style="margin-top: 1.1rem">
      Inspect Full Road Audit & Report Γ₧ö
    </button>
  `;

  const btnInspect = document.getElementById('btnMapInspectModal');
  if (btnInspect) {
    btnInspect.onclick = () => openVillageModal(v);
  }
}

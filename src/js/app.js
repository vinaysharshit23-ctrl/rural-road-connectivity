/**
 * Main Application Controller
 * Manages global application state, tab routing, destination toggles, state filters, and component wiring.
 * Supports APMC Markets, Urban Job Hubs, District Emergency Hospitals AND Road Condition Categories.
 */

import { INITIAL_VILLAGES } from './data/villages.js';
import { enrichVillagesData } from './engine/indexCalculator.js';
import { renderDashboardKPIs } from './components/dashboard.js';
import { renderVillageTable, setupTableSorting } from './components/villageTable.js';
import { renderVillageCardGrid } from './components/cardGrid.js';
import { renderCasRankingView } from './components/casRanking.js';
import { initMapViewer, setMapDestinationMode, setSelectedVillageOnMap } from './components/mapViewer.js';
import { setupBudgetSimulator, setupCustomVillageCalculator } from './components/simulator.js';
import { openVillageModal, setupModalControls } from './components/modal.js';

let activeVillages = enrichVillagesData(INITIAL_VILLAGES);
let currentMapDestMode = 'ALL';
let currentPillFilter = 'ALL';
let currentMsSort = 'SCORE_DESC';
let currentMsDistrict = 'ALL';

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
  const savedTheme = localStorage.getItem('rrc_theme') || 'riverine';
  
  // Apply initial theme
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  function applyActiveState(themeName) {
    themeBtns.forEach(b => {
      const isMatch = b.getAttribute('data-theme-btn') === themeName;
      b.style.borderColor = isMatch ? '#ffffff' : 'transparent';
      if (isMatch) {
        b.classList.add('active');
        b.style.transform = 'scale(1.15)';
      } else {
        b.classList.remove('active');
        b.style.transform = 'scale(1)';
      }
    });
  }

  applyActiveState(savedTheme);

  themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const selectedTheme = btn.getAttribute('data-theme-btn');
      document.documentElement.setAttribute('data-theme', selectedTheme);
      localStorage.setItem('rrc_theme', selectedTheme);
      applyActiveState(selectedTheme);
    });
  });
}

function updateAllComponents() {
  const filtered = filterVillages();

  // Dynamic pill filter counts based on real ground-truth data
  const pillAll = document.getElementById('pillAll');
  const pillCritical = document.getElementById('pillCritical');
  const pillHilly = document.getElementById('pillHilly');
  const pillRiverine = document.getElementById('pillRiverine');
  const pillRoi = document.getElementById('pillRoi');

  const countAll = activeVillages.length;
  const countCritical = activeVillages.filter(v => v.roadConditionCategory === 'SEVERELY_BAD').length;
  const countHilly = activeVillages.filter(v => v.terrain && v.terrain.includes('Hilly')).length;
  const countRiverine = activeVillages.filter(v => v.terrain && (v.terrain.includes('Riverine') || v.terrain.includes('Plains'))).length;
  const countRoi = activeVillages.filter(v => v.metrics && v.metrics.roiPerCrore >= 2.5).length;

  if (pillAll) pillAll.textContent = `All Habitations (${countAll})`;
  if (pillCritical) pillCritical.textContent = `🔴 Critical Bad (${countCritical})`;
  if (pillHilly) pillHilly.textContent = `⛰️ Hilly Malnad (${countHilly})`;
  if (pillRiverine) pillRiverine.textContent = `🌊 Riverine / Plains (${countRiverine})`;
  if (pillRoi) pillRoi.textContent = `📈 High ROI (${countRoi})`;

  renderDashboardKPIs(activeVillages);
  renderVillageCardGrid(filtered, handleInspectVillage);
  renderVillageTable(filtered, handleInspectVillage);
  renderCasRankingView(filtered, handleInspectVillage);

  // Map is initialized lazily on first tab-map show (see setupNavigationTabs).
  // Re-render pins if already initialized.
  if (mapEverInitialized) {
    initMapViewer(filtered, renderMapSidebar, currentMapDestMode);
  }

  if (filtered.length > 0) {
    renderMapSidebar(filtered[0]);
  }
}

function filterVillages() {
  const searchInput = document.getElementById('searchInput');
  const msSearch = document.getElementById('msSearchInput');
  const conditionFilter = document.getElementById('conditionFilter');
  const stateFilter = document.getElementById('stateFilter');
  const terrainFilter = document.getElementById('terrainFilter');

  const query1 = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const query2 = msSearch ? msSearch.value.toLowerCase().trim() : '';
  const query = query2 || query1;

  const selectedCondition = conditionFilter ? conditionFilter.value : 'ALL';
  const selectedState = (currentMsDistrict !== 'ALL') ? currentMsDistrict : (stateFilter ? stateFilter.value : 'ALL');
  const selectedTerrain = terrainFilter ? terrainFilter.value : 'ALL';

  let results = activeVillages.filter(v => {
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
    const matchesDistrict = selectedState === 'ALL' || v.district === selectedState;
    const matchesTerrain = selectedTerrain === 'ALL' || v.terrain === selectedTerrain;

    // MotionSites Pill Filters
    let matchesPill = true;
    if (currentPillFilter === 'CRITICAL') {
      matchesPill = v.roadConditionCategory === 'SEVERELY_BAD';
    } else if (currentPillFilter === 'HILLY') {
      matchesPill = v.terrain && v.terrain.includes('Hilly');
    } else if (currentPillFilter === 'RIVERINE') {
      matchesPill = v.terrain && (v.terrain.includes('Riverine') || v.terrain.includes('Plains'));
    } else if (currentPillFilter === 'ROI') {
      matchesPill = (v.metrics && v.metrics.roiPerCrore >= 2.5);
    }

    return matchesSearch && matchesCondition && matchesDistrict && matchesTerrain && matchesPill;
  });

  // Sort results according to currentMsSort
  results.sort((a, b) => {
    if (currentMsSort === 'SCORE_DESC') {
      return (b.metrics?.maiScore || 0) - (a.metrics?.maiScore || 0);
    } else if (currentMsSort === 'ROI_DESC') {
      return (b.metrics?.roiPerCrore || 0) - (a.metrics?.roiPerCrore || 0);
    } else if (currentMsSort === 'TIME_DESC') {
      return (b.metrics?.timeSavedHrs || 0) - (a.metrics?.timeSavedHrs || 0);
    } else if (currentMsSort === 'POP_DESC') {
      return (b.population || 0) - (a.population || 0);
    } else if (currentMsSort === 'COST_ASC') {
      return (a.estCostLakhs || 0) - (b.estCostLakhs || 0);
    }
    return 0;
  });

  return results;
}

function setupSearchAndFilters() {
  const searchInput = document.getElementById('searchInput');
  const msSearch = document.getElementById('msSearchInput');
  const conditionFilter = document.getElementById('conditionFilter');
  const stateFilter = document.getElementById('stateFilter');
  const terrainFilter = document.getElementById('terrainFilter');
  const districtSelect = document.getElementById('msDistrictSelect');
  const sortSelect = document.getElementById('msSortSelect');

  const handleFilterChange = () => {
    const filtered = filterVillages();
    renderVillageCardGrid(filtered, handleInspectVillage);
    renderVillageTable(filtered, handleInspectVillage);
    initMapViewer(filtered, renderMapSidebar, currentMapDestMode);
  };

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      if (msSearch) msSearch.value = e.target.value;
      handleFilterChange();
    });
  }

  if (msSearch) {
    msSearch.addEventListener('input', (e) => {
      if (searchInput) searchInput.value = e.target.value;
      handleFilterChange();
    });
  }

  // MotionSites Filter Pill Buttons
  const pillBtns = document.querySelectorAll('[data-pill-filter]');
  pillBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      pillBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentPillFilter = btn.getAttribute('data-pill-filter');
      handleFilterChange();
    });
  });

  if (districtSelect) {
    districtSelect.addEventListener('change', (e) => {
      currentMsDistrict = e.target.value;
      if (stateFilter) stateFilter.value = e.target.value;
      handleFilterChange();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentMsSort = e.target.value;
      handleFilterChange();
    });
  }

  if (conditionFilter) conditionFilter.addEventListener('change', handleFilterChange);
  if (stateFilter) {
    stateFilter.addEventListener('change', (e) => {
      currentMsDistrict = e.target.value;
      if (districtSelect) districtSelect.value = e.target.value;
      handleFilterChange();
    });
  }
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

    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (targetViewId === 'tab-map') {
      // Delay must be long enough for display:block to paint before Leaflet
      // reads the container dimensions — 150ms covers CDN-served deployments.
      setTimeout(() => {
        mapEverInitialized = true;
        initMapViewer(filterVillages(), renderMapSidebar, currentMapDestMode);
      }, 150);
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

    <div style="background: ${isSeverelyBad ? '#FFF3F0' : '#FFFBF0'}; border: 2px solid ${isSeverelyBad ? 'var(--coral)' : '#C08000'}; padding: 0.65rem 0.85rem; margin-bottom: 0.85rem;">
      <div style="font-size: 0.72rem; text-transform: uppercase; font-weight: 700; letter-spacing: 0.06em; color: ${isSeverelyBad ? 'var(--coral)' : '#B07800'};">Existing Road Condition</div>
      <div style="font-size: 0.9rem; font-weight: 700; color: var(--ink); margin-top: 0.15rem;">
        ${isSeverelyBad ? '🔴 Severely Bad (Critical)' : '🟠 Bad Surface (Poor Gravel)'}
      </div>
      <div style="font-size: 0.72rem; color: var(--text-2); margin-top: 0.1rem;">
        ${v.existingRoadType} • Cut off ${v.monsoonIsolationDays}d/yr
      </div>
    </div>

    <!-- Urban Road Route Breakdown Card -->
    <div style="background: var(--bg-card2); border: 2px solid var(--border-soft); padding: 0.75rem 0.85rem; margin-bottom: 1rem;">
      <div style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-2); display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.3rem;">
        <span>🏙️ Urban Hub Access Route</span>
        <span style="font-size: 0.7rem; color: var(--text-3);">${v.urbanHubDistKm} km total</span>
      </div>
      <div style="font-size: 0.88rem; font-weight: 800; color: var(--ink); margin-bottom: 0.4rem;">
        ${v.nearestUrbanHub}
      </div>
      <div style="display: flex; align-items: center; gap: 0.35rem; font-size: 0.72rem; background: #fff; border: 1px solid var(--border-soft); padding: 0.4rem 0.6rem; margin-bottom: 0.4rem; font-family: var(--font-mono);">
        <span style="color: ${isSeverelyBad ? 'var(--coral)' : '#B07800'}; font-weight: 700;">${v.roadLengthKm}km bad track</span>
        <span style="color: var(--text-3);">→</span>
        <span style="color: var(--ink); font-weight: 600;">${highwayDist}km Highway</span>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-2); margin-top: 0.2rem;">
        <span>Current: <strong style="color: var(--coral);">${v.currentUrbanTravelTimeMin} mins</strong></span>
        <span>Post-Road: <strong style="color: #2A6B50;">${v.postUrbanTravelTimeMin} mins</strong></span>
      </div>
      <div style="font-size: 0.7rem; color: var(--text-2); margin-top: 0.35rem; border-top: 1px solid var(--border-soft); padding-top: 0.35rem;">
        🎯 <strong>Access to:</strong> ${v.primaryUrbanOpportunity}
      </div>
    </div>

    <div class="stat-row">
      <span class="stat-label">Population:</span>
      <span class="stat-val">${v.population.toLocaleString()}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Nearest APMC Market:</span>
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
      Inspect Full Road Audit & Report ➔
    </button>
  `;

  const btnInspect = document.getElementById('btnMapInspectModal');
  if (btnInspect) {
    btnInspect.onclick = () => openVillageModal(v);
  }
}

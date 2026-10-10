/**
 * Individual Village Map Inspector Component
 * High-performance, realistic Leaflet GIS Map Renderer.
 * Supports Esri World Imagery (Satellite), OpenStreetMap, CartoDB Dark Mode & Topographic Terrain maps.
 * Renders interactive village pins, multi-sector destination routes (APMC Mandis, Urban Hubs, Emergency Hospitals, Bus Stops),
 * bad track distance callouts, and animated layer transitions.
 */

let map = null;
let currentTileLayer = null;
let tileLayers = {};
let activeVillageId = null;
let villagesData = [];
let destinationMode = 'ALL';
let currentTileName = 'satellite';

let activeVillageGroup = null;
let otherVillagesGroup = null;

export function initMapViewer(villages, onSelectVillage, initialMode = 'ALL') {
  villagesData = villages;
  destinationMode = initialMode;

  if (villagesData.length > 0 && !activeVillageId) {
    activeVillageId = villagesData[0].id;
  }

  populateVillageDropdown(onSelectVillage);

  const mapContainer = document.getElementById('leafletMap');
  if (!mapContainer) return;

  const L = window.L;
  if (!L) {
    console.error('Leaflet JS library (L) is not loaded.');
    return;
  }

  // Initialize Leaflet Map instance if not already initialized
  if (!map) {
    // Default Center on Karnataka: [14.5244, 75.7218], zoom: 7
    map = L.map('leafletMap', {
      zoomControl: false,
      attributionControl: false
    }).setView([14.2230, 76.3980], 11);

    // 1. Define Realistic Tile Providers
    tileLayers = {
      satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 18,
        attribution: 'Tiles &copy; Esri'
      }),
      street: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
      }),
      dark: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        attribution: '&copy; CartoDB'
      }),
      topo: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        maxZoom: 17,
        attribution: '&copy; OpenTopoMap'
      })
    };

    // Default to Realistic Satellite View
    currentTileLayer = tileLayers.satellite;
    currentTileLayer.addTo(map);

    // Create Feature Groups
    otherVillagesGroup = L.featureGroup().addTo(map);
    activeVillageGroup = L.featureGroup().addTo(map);

    setupLayerControls();
    setupMapInteractions(onSelectVillage);
  }

  // Force Leaflet to recalculate container size after the tab is visible.
  // Uses requestAnimationFrame to wait for the browser paint cycle, then
  // a 200ms fallback — this covers both localhost and CDN-served deployments
  // where display:block hasn't propagated at call time.
  const forceResize = () => {
    if (!map) return;
    map.invalidateSize({ animate: false });
    // Second pass after layout settles
    setTimeout(() => { if (map) map.invalidateSize({ animate: false }); }, 250);
  };
  requestAnimationFrame(() => requestAnimationFrame(forceResize));

  renderLeafletMap(onSelectVillage);
}

export function setSelectedVillageOnMap(villageId) {
  activeVillageId = villageId;
  const select = document.getElementById('individualVillageSelect');
  if (select) select.value = villageId;
  
  const village = villagesData.find(v => v.id === activeVillageId);
  if (village && map && window.L) {
    const lat = village.lat || 14.2230;
    const lng = village.lng || 76.3980;
    map.flyTo([lat, lng], 12, { duration: 1.2 });
  }

  renderLeafletMap();
}

export function setMapDestinationMode(mode) {
  destinationMode = mode;
  renderLeafletMap();
}

function populateVillageDropdown(onSelectVillage) {
  const select = document.getElementById('individualVillageSelect');
  if (!select) return;

  select.innerHTML = villagesData.map(v => {
    const isBad = v.roadConditionCategory === 'SEVERELY_BAD' ? '🔴' : '🟠';
    const casScore = v.metrics && v.metrics.accessibility ? v.metrics.accessibility.current : '';
    return `<option value="${v.id}" ${v.id === activeVillageId ? 'selected' : ''}>
      ${isBad} ${v.name} (${v.district}) - CAS: ${casScore}/100
    </option>`;
  }).join('');

  select.onchange = (e) => {
    activeVillageId = e.target.value;
    const village = villagesData.find(v => v.id === activeVillageId);
    if (village && map) {
      const lat = village.lat || 14.2230;
      const lng = village.lng || 76.3980;
      map.flyTo([lat, lng], 12, { duration: 1.2 });
    }
    renderLeafletMap();
    if (village && onSelectVillage) {
      onSelectVillage(village);
    }
  };
}

function setupLayerControls() {
  const btnSat = document.getElementById('btnLayerSat');
  const btnStreet = document.getElementById('btnLayerStreet');
  const btnDark = document.getElementById('btnLayerDark');
  const btnTopo = document.getElementById('btnLayerTopo');

  const layerBtns = [btnSat, btnStreet, btnDark, btnTopo].filter(Boolean);

  const switchLayer = (targetName, activeBtn) => {
    if (!map || !tileLayers[targetName]) return;
    
    if (currentTileLayer) {
      map.removeLayer(currentTileLayer);
    }
    
    currentTileLayer = tileLayers[targetName];
    currentTileLayer.addTo(map);
    currentTileName = targetName;

    layerBtns.forEach(b => b.classList.remove('active'));
    if (activeBtn) activeBtn.classList.add('active');
  };

  if (btnSat) btnSat.onclick = () => switchLayer('satellite', btnSat);
  if (btnStreet) btnStreet.onclick = () => switchLayer('street', btnStreet);
  if (btnDark) btnDark.onclick = () => switchLayer('dark', btnDark);
  if (btnTopo) btnTopo.onclick = () => switchLayer('topo', btnTopo);
}

function setupMapInteractions(onSelectVillage) {
  const btnZoomIn = document.getElementById('btnZoomIn');
  const btnZoomOut = document.getElementById('btnZoomOut');
  const btnResetMap = document.getElementById('btnResetMap');

  if (btnZoomIn) btnZoomIn.onclick = () => map.zoomIn();
  if (btnZoomOut) btnZoomOut.onclick = () => map.zoomOut();
  if (btnResetMap) {
    btnResetMap.onclick = () => {
      const v = villagesData.find(item => item.id === activeVillageId);
      if (v) {
        map.flyTo([v.lat || 14.2230, v.lng || 76.3980], 12, { duration: 1.0 });
      } else {
        map.setView([14.2230, 76.3980], 11);
      }
    };
  }
}

function renderLeafletMap(onSelectVillage) {
  const L = window.L;
  if (!map || !L) return;

  // Clear existing layers
  if (activeVillageGroup) activeVillageGroup.clearLayers();
  if (otherVillagesGroup) otherVillagesGroup.clearLayers();

  const activeVillage = villagesData.find(v => v.id === activeVillageId) || villagesData[0];
  if (!activeVillage) return;

  const vLat = activeVillage.lat || 14.2230;
  const vLng = activeVillage.lng || 76.3980;
  const isSeverelyBad = activeVillage.roadConditionCategory === 'SEVERELY_BAD';
  const villageColor = isSeverelyBad ? '#ef4444' : '#f59e0b';
  const cas = activeVillage.metrics ? activeVillage.metrics.accessibility : { current: 25, projected: 88 };

  // 1. Render Other Karnataka Villages as small markers for spatial context
  villagesData.forEach(v => {
    if (v.id === activeVillageId) return;
    const lat = v.lat || 14.2230;
    const lng = v.lng || 76.3980;

    const isBad = v.roadConditionCategory === 'SEVERELY_BAD';
    const markerColor = isBad ? '#ef4444' : '#f59e0b';

    const smallIcon = L.divIcon({
      className: 'custom-small-pin',
      html: `<div style="background: ${markerColor}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid #ffffff; box-shadow: 0 0 6px ${markerColor}; cursor: pointer"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6]
    });

    const marker = L.marker([lat, lng], { icon: smallIcon });
    marker.bindTooltip(`<b>${v.name}</b> (${v.district})<br/>CAS: ${v.metrics ? v.metrics.accessibility.current : ''}/100`, { direction: 'top' });
    marker.on('click', () => {
      setSelectedVillageOnMap(v.id);
      if (onSelectVillage) onSelectVillage(v);
    });

    otherVillagesGroup.addLayer(marker);
  });

  // 2. Render Active Target Village Node (Main Marker with Pulsing Aura)
  const mainPinIcon = L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center;">
        <div class="${isSeverelyBad ? 'pulse-ring-bad' : 'pulse-ring-amber'}"></div>
        <div style="background: ${villageColor}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 0 16px ${villageColor}; z-index: 2"></div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });

  const activeMarker = L.marker([vLat, vLng], { icon: mainPinIcon, zIndexOffset: 1000 });
  
  // Custom Dark Popup Card for Active Village
  const popupHtml = `
    <div style="padding: 0.5rem 0.6rem; min-width: 220px">
      <div style="font-size: 0.72rem; font-weight: 800; color: ${villageColor}; text-transform: uppercase; letter-spacing: 0.05em">
        ${isSeverelyBad ? '🔴 Critical Isolation' : '🟠 Poor Road Condition'}
      </div>
      <div style="font-size: 1.05rem; font-weight: 800; color: #fff; margin: 0.25rem 0">
        ${activeVillage.name}
      </div>
      <div style="font-size: 0.78rem; color: #cbd5e1; margin-bottom: 0.5rem">
        📍 ${activeVillage.district} District • ${activeVillage.terrain} Terrain
      </div>

      <div style="background: rgba(15,23,42,0.8); border: 1px solid rgba(255,255,255,0.1); padding: 0.45rem 0.6rem; border-radius: 8px; font-size: 0.75rem; margin-bottom: 0.5rem">
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.2rem">
          <span>Accessibility Score:</span>
          <strong style="color: ${villageColor}">${cas.current}/100</strong>
        </div>
        <div style="display: flex; justify-content: space-between">
          <span>Monsoon Isolation:</span>
          <strong style="color: #fca5a5">${activeVillage.monsoonIsolationDays} days/yr</strong>
        </div>
      </div>

      <div style="font-size: 0.72rem; color: #94a3b8">
        🛣️ Track: ${activeVillage.existingRoadType} (${activeVillage.roadLengthKm} km)
      </div>
    </div>
  `;

  activeMarker.bindPopup(popupHtml, { autoClose: false, closeOnClick: false });
  activeVillageGroup.addLayer(activeMarker);

  // 3. Define Relative Geographic Destination Coordinates
  const jCoords = activeVillage.junctionCoords || [vLat + 0.015, vLng - 0.012];
  const uCoords = activeVillage.urbanCoords || [vLat + 0.045, vLng + 0.035];
  const mCoords = activeVillage.mandiCoords || [vLat + 0.025, vLng + 0.028];
  const hCoords = activeVillage.hospitalCoords || [vLat - 0.022, vLng - 0.032];
  const bCoords = activeVillage.busCoords || [vLat + 0.008, vLng + 0.015];

  // --- DESTINATION ROUTES & POLYLINES ---

  // Route A: Urban Job Hub & Highway Corridor
  if (destinationMode === 'ALL' || destinationMode === 'URBAN') {
    // 1. Unpaved Bad Track Polyline (Village ➔ Highway Junction)
    const badTrackPolyline = L.polyline([[vLat, vLng], jCoords], {
      color: villageColor,
      weight: 4.5,
      dashArray: '8, 6',
      opacity: 0.95
    });

    badTrackPolyline.bindTooltip(`🔴 ${activeVillage.roadLengthKm}km Unpaved Bad Track (${activeVillage.maxCurrentSpeedKmh} km/h max speed)`, { sticky: true });
    activeVillageGroup.addLayer(badTrackPolyline);

    // 2. Highway Junction Node Marker
    const jMarkerIcon = L.divIcon({
      className: 'custom-j-pin',
      html: `<div class="pin-badge" style="border-color: ${villageColor}; font-size: 0.7rem">🛑 Highway Junction</div>`,
      iconSize: [120, 24],
      iconAnchor: [60, 12]
    });
    activeVillageGroup.addLayer(L.marker(jCoords, { icon: jMarkerIcon }));

    // 3. Paved Highway Polyline (Junction ➔ Urban Hub)
    const highwayPolyline = L.polyline([jCoords, uCoords], {
      color: '#38bdf8',
      weight: 4,
      opacity: 0.9
    });
    highwayPolyline.bindTooltip(`🌐 State Highway to ${activeVillage.nearestUrbanHub || 'Urban Hub'} (-${activeVillage.metrics ? activeVillage.metrics.urbanTimeSavedHrs : 2} hrs saved)`, { sticky: true });
    activeVillageGroup.addLayer(highwayPolyline);

    // 4. Urban Hub Marker
    const uPinIcon = L.divIcon({
      className: 'custom-u-pin',
      html: `<div class="pin-badge" style="border-color: #38bdf8">🏙️ ${activeVillage.nearestUrbanHub || 'Urban Hub'}</div>`,
      iconSize: [180, 28],
      iconAnchor: [90, 14]
    });
    const uMarker = L.marker(uCoords, { icon: uPinIcon });
    uMarker.bindPopup(`<b>🏙️ ${activeVillage.nearestUrbanHub}</b><br/>Commute Saved: ${activeVillage.metrics ? activeVillage.metrics.urbanTimeSavedHrs : 2} hrs<br/>Opportunities: ${activeVillage.primaryUrbanOpportunity || 'Jobs & Higher Education'}`);
    activeVillageGroup.addLayer(uMarker);
  }

  // Route B: APMC Agricultural Mandi Corridor (Purple Line)
  if (destinationMode === 'ALL' || destinationMode === 'MANDI') {
    const mandiPolyline = L.polyline([[vLat, vLng], mCoords], {
      color: '#a855f7',
      weight: 3.5,
      dashArray: '6, 5',
      opacity: 0.85
    });
    mandiPolyline.bindTooltip(`🌾 Crop Corridor to ${activeVillage.nearestMandi} (-${activeVillage.metrics ? activeVillage.metrics.timeSavedHrs : 1.5}h saved)`, { sticky: true });
    activeVillageGroup.addLayer(mandiPolyline);

    const mPinIcon = L.divIcon({
      className: 'custom-m-pin',
      html: `<div class="pin-badge" style="border-color: #a855f7">🌾 APMC: ${activeVillage.nearestMandi}</div>`,
      iconSize: [170, 28],
      iconAnchor: [85, 14]
    });
    const mMarker = L.marker(mCoords, { icon: mPinIcon });
    mMarker.bindPopup(`<b>🌾 ${activeVillage.nearestMandi}</b><br/>Primary Crop: ${activeVillage.primaryCrop}<br/>Annual Yield: ${activeVillage.annualAgriYieldTons} Tons<br/>Spoilage Reduction: ${activeVillage.metrics ? activeVillage.metrics.annualAgriSavedLakhs : 0} Lakhs/yr`);
    activeVillageGroup.addLayer(mMarker);
  }

  // Route C: Emergency Hospital ICU Corridor (Rose/Red Line)
  if (destinationMode === 'ALL' || destinationMode === 'HOSPITAL') {
    const hospitalPolyline = L.polyline([[vLat, vLng], hCoords], {
      color: '#f43f5e',
      weight: 3.5,
      dashArray: '4, 4',
      opacity: 0.9
    });
    hospitalPolyline.bindTooltip(`🏥 Ambulance Transit to ${activeVillage.nearestHospitalHub} (-${activeVillage.metrics ? activeVillage.metrics.hospitalTimeSavedHrs : 2} hrs saved)`, { sticky: true });
    activeVillageGroup.addLayer(hospitalPolyline);

    const hPinIcon = L.divIcon({
      className: 'custom-h-pin',
      html: `<div class="pin-badge" style="border-color: #f43f5e">🏥 ${activeVillage.nearestHospitalHub}</div>`,
      iconSize: [190, 28],
      iconAnchor: [95, 14]
    });
    const hMarker = L.marker(hCoords, { icon: hPinIcon });
    hMarker.bindPopup(`<b>🏥 ${activeVillage.nearestHospitalHub}</b><br/>Emergency Saved: -${activeVillage.metrics ? activeVillage.metrics.hospitalTimeSavedHrs : 2} hrs<br/>Services: ${activeVillage.primaryHealthcareServices}`);
    activeVillageGroup.addLayer(hMarker);
  }

  // Route D: KSRTC Public Bus Route (Gold/Amber Line)
  if (destinationMode === 'ALL' || destinationMode === 'BUS') {
    const busPolyline = L.polyline([[vLat, vLng], bCoords], {
      color: '#eab308',
      weight: 3.5,
      dashArray: '6, 4',
      opacity: 0.9
    });
    busPolyline.bindTooltip(`🚌 KSRTC Bus Route (${activeVillage.currentBusFrequencyPerDay} ➔ ${activeVillage.projectedBusFrequencyPerDay} trips/day)`, { sticky: true });
    activeVillageGroup.addLayer(busPolyline);

    const bPinIcon = L.divIcon({
      className: 'custom-b-pin',
      html: `<div class="pin-badge" style="border-color: #eab308">🚌 ${activeVillage.ksrtcDivision || 'KSRTC Stop'}</div>`,
      iconSize: [180, 28],
      iconAnchor: [90, 14]
    });
    const bMarker = L.marker(bCoords, { icon: bPinIcon });
    bMarker.bindPopup(`<b>🚌 ${activeVillage.ksrtcDivision || 'KSRTC Bus Stop'}</b><br/>Gramina Sarige Frequency: ${activeVillage.currentBusFrequencyPerDay} ➔ ${activeVillage.projectedBusFrequencyPerDay} trips/day<br/>Walk to Bus Stop: ${activeVillage.walkToBusStopKm} km`);
    activeVillageGroup.addLayer(bMarker);
  }

  // Open active village marker popup automatically
  setTimeout(() => {
    activeMarker.openPopup();
  }, 300);
}

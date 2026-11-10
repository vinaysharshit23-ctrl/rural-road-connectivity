/**
 * Individual Village Map Inspector Component
 * High-performance, realistic Leaflet GIS Map Renderer.
 * Supports Esri World Imagery (Satellite), OpenStreetMap, CartoDB Dark Mode & Topographic Terrain maps.
 *
 * ROUTING: Uses OSRM public API (router.project-osrm.org) for real road-network routing.
 * Each route is split into two segments:
 *   1. Village → Highway Junction: dashed red/amber polyline = the kutcha "missing link"
 *   2. Junction → Destination: solid colored polyline = existing paved highway
 * Falls back to straight-line vectors if OSRM is unavailable or times out.
 * Routes are cached per village (osrmCache) to avoid re-fetching on mode switches.
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

/* ── OSRM Routing Cache & Helpers ───────────────────────────────────────────
 * osrmCache: Map<cacheKey, [LatLng[]]> — decoded polyline coordinates per route leg.
 * fetchOsrmRoute(origin, dest) → Promise<LatLng[]>
 *   Calls OSRM public API, decodes geometry, returns [[lat,lng], ...].
 *   Rejects on network error or no-route (caller falls back to straight line).
 * getRouteLegs(origin, junction, dest, cacheKeyPrefix) → Promise<{kutcha, highway}>
 *   Returns two arrays: kutcha (village→junction) and highway (junction→dest).
 * ─────────────────────────────────────────────────────────────────────────── */
const osrmCache = new Map();

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

async function fetchOsrmRoute(fromLat, fromLng, toLat, toLng) {
  const key = `${fromLat.toFixed(4)},${fromLng.toFixed(4)}-${toLat.toFixed(4)},${toLng.toFixed(4)}`;
  if (osrmCache.has(key)) return osrmCache.get(key);

  const url = `${OSRM_BASE}/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson&steps=false`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000); // 6s timeout

  try {
    const resp = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!resp.ok) throw new Error('OSRM HTTP ' + resp.status);
    const data = await resp.json();
    if (!data.routes || !data.routes[0]) throw new Error('No route returned');
    // GeoJSON coords are [lng, lat] — flip to [lat, lng] for Leaflet
    const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
    osrmCache.set(key, coords);
    return coords;
  } catch (e) {
    clearTimeout(timer);
    // Return straight line as fallback
    const fallback = [[fromLat, fromLng], [toLat, toLng]];
    osrmCache.set(key, fallback);
    return fallback;
  }
}

// Haversine distance in km between two [lat,lng] points
function haversineKm([lat1, lng1], [lat2, lng2]) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Fetch a single village→destination route and split it at kutchaLengthKm.
// The first segment (kutcha) = dashed missing link; the rest (highway) = existing road.
async function getRouteLegs(vLat, vLng, jLat, jLng, dLat, dLng, _prefix, kutchaLengthKm = 5) {
  const allCoords = await fetchOsrmRoute(vLat, vLng, dLat, dLng);

  // Walk the polyline accumulating distance until we reach kutchaLengthKm
  let accumulated = 0;
  let splitIdx = allCoords.length - 1; // fallback: entire route is kutcha
  for (let i = 1; i < allCoords.length; i++) {
    accumulated += haversineKm(allCoords[i - 1], allCoords[i]);
    if (accumulated >= kutchaLengthKm) {
      splitIdx = i;
      break;
    }
  }

  const kutcha  = [[vLat, vLng], ...allCoords.slice(0, splitIdx + 1)];
  const highway = allCoords.slice(splitIdx);
  return { kutcha, highway };
}

function showMapError(msg) {
  const el = document.getElementById('leafletMap');
  if (el) {
    el.style.cssText = 'width:100%;height:620px;background:#fff;display:flex;align-items:center;justify-content:center;font-family:monospace;font-size:14px;color:#c00;border:2px solid #c00;padding:1rem;box-sizing:border-box;';
    el.innerHTML = '<div><b>MAP ERROR:</b><br>' + msg + '</div>';
  }
}

export function initMapViewer(villages, onSelectVillage, initialMode = 'ALL') {
  villagesData = villages;
  destinationMode = initialMode;

  if (villagesData.length > 0 && !activeVillageId) {
    activeVillageId = villagesData[0].id;
  }

  populateVillageDropdown(onSelectVillage);

  const mapContainer = document.getElementById('leafletMap');
  if (!mapContainer) { showMapError('leafletMap div not found in DOM'); return; }

  const L = window.L;
  if (!L) {
    showMapError('Leaflet (window.L) is not loaded — leaflet.js script failed');
    return;
  }

  // Force an explicit pixel height BEFORE Leaflet reads the container,
  // so it never sees a 0px box regardless of display:block propagation timing.
  mapContainer.style.height = '620px';
  mapContainer.style.minHeight = '620px';

  // If a stale map instance exists (e.g. initialized into a hidden container),
  // destroy it and start fresh so Leaflet reads the correct container size.
  if (map) {
    map.remove();
    map = null;
    currentTileLayer = null;
    tileLayers = {};
    activeVillageGroup = null;
    otherVillagesGroup = null;
  }

  // Initialize Leaflet Map instance
  try {
    // Default Center on Karnataka
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

  } catch(e) {
    showMapError('L.map() threw: ' + e.message);
    map = null;
    return;
  }

  // Force Leaflet to recalculate container size after the tab is visible.
  const forceResize = () => {
    if (!map) return;
    map.invalidateSize({ animate: false });
    setTimeout(() => { if (map) map.invalidateSize({ animate: false }); }, 500);
    setTimeout(() => { if (map) map.invalidateSize({ animate: false }); }, 1000);
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
        <div style="background: ${villageColor}; width: 32px; height: 32px; border-radius: 50%; border: 4px solid #ffffff; box-shadow: 0 0 24px ${villageColor}, 0 0 8px rgba(0,0,0,0.6); z-index: 2"></div>
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24]
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
  const jCoords = activeVillage.junctionCoords  || [vLat + 0.015, vLng - 0.012];
  const uCoords = activeVillage.urbanCoords     || [vLat + 0.045, vLng + 0.035];
  const mCoords = activeVillage.mandiCoords     || [vLat + 0.025, vLng + 0.028];
  const hCoords = activeVillage.hospitalCoords  || [vLat - 0.022, vLng - 0.032];
  const bCoords = activeVillage.busCoords       || [vLat + 0.008, vLng + 0.015];

  // ── Route legend (injected once into the map container DOM) ─────────────
  if (!document.getElementById('osrm-route-legend')) {
    const leg = document.createElement('div');
    leg.id = 'osrm-route-legend';
    leg.style.cssText = 'position:absolute;bottom:128px;left:12px;z-index:500;background:rgba(255,255,255,.95);border:2px solid #1A1A1A;padding:8px 12px;font-family:Inter,sans-serif;font-size:11px;line-height:1.8;pointer-events:none;';
    leg.innerHTML = '<b style="font-size:10px;letter-spacing:.06em;text-transform:uppercase;display:block;margin-bottom:2px;">Route Legend</b>'
      + '<div><svg width="28" height="8" style="vertical-align:middle;margin-right:6px"><line x1="0" y1="4" x2="28" y2="4" stroke="#ef4444" stroke-width="3" stroke-dasharray="7,4"/></svg>Kutcha missing link</div>'
      + '<div><svg width="28" height="8" style="vertical-align:middle;margin-right:6px"><line x1="0" y1="4" x2="28" y2="4" stroke="#22c55e" stroke-width="3"/></svg>Existing highway/road</div>'
      + '<div style="font-size:10px;color:#888;margin-top:3px;">Routed via OSRM · fallback: straight line</div>';
    document.getElementById('leafletMap').appendChild(leg);
  }

  // ── Route drawing ───────────────────────────────────────────────────────
  // The kutcha "missing link" is the same physical road regardless of which
  // destination the villager is heading to — draw it ONCE from the first
  // active destination's route, then draw each highway segment separately.
  //
  // Strategy:
  //   1. Pick the first visible destination to derive the kutcha coords.
  //   2. Draw the shared kutcha line + highway join marker once.
  //   3. For every destination: draw only its highway segment + dest pin.

  const destinations = [
    {
      modeKey: 'MANDI', destCoords: mCoords,
      destLabel: `🌾 APMC: ${activeVillage.nearestMarket}`,
      destPopupHtml: `<b>🌾 ${activeVillage.nearestMarket}</b><br/>Crop: ${activeVillage.primaryCrop}<br/>Yield: ${activeVillage.annualAgriYieldTons} T/yr<br/>Spoilage saved: ₹${activeVillage.metrics ? activeVillage.metrics.annualAgriSavedLakhs : 0}L/yr`,
      highwayColor: '#a855f7',
      tooltipText: `Crop corridor to ${activeVillage.nearestMarket} · ${activeVillage.metrics ? activeVillage.metrics.timeSavedHrs : '?'} hrs saved`
    },
    {
      modeKey: 'URBAN', destCoords: uCoords,
      destLabel: `🏙️ ${activeVillage.nearestUrbanHub || 'Urban Hub'}`,
      destPopupHtml: `<b>🏙️ ${activeVillage.nearestUrbanHub}</b><br/>Commute saved: ${activeVillage.metrics ? activeVillage.metrics.urbanTimeSavedHrs : '?'} hrs<br/>${activeVillage.primaryUrbanOpportunity || 'Jobs & Higher Education'}`,
      highwayColor: '#38bdf8',
      tooltipText: `State highway to ${activeVillage.nearestUrbanHub || 'Urban Hub'} · ${activeVillage.metrics ? activeVillage.metrics.urbanTimeSavedHrs : '?'} hrs saved`
    },
    {
      modeKey: 'HOSPITAL', destCoords: hCoords,
      destLabel: `🏥 ${activeVillage.nearestHospitalHub}`,
      destPopupHtml: `<b>🏥 ${activeVillage.nearestHospitalHub}</b><br/>Emergency transit saved: ${activeVillage.metrics ? activeVillage.metrics.hospitalTimeSavedHrs : '?'} hrs<br/>${activeVillage.primaryHealthcareServices}`,
      highwayColor: '#f43f5e',
      tooltipText: `Ambulance corridor to ${activeVillage.nearestHospitalHub} · ${activeVillage.metrics ? activeVillage.metrics.hospitalTimeSavedHrs : '?'} hrs saved`
    },
    {
      modeKey: 'BUS', destCoords: bCoords,
      destLabel: `🚌 ${activeVillage.ksrtcDivision || 'KSRTC Stop'}`,
      destPopupHtml: `<b>🚌 ${activeVillage.ksrtcDivision || 'KSRTC Bus Stop'}</b><br/>Gramina Sarige: ${activeVillage.currentBusFrequencyPerDay} → ${activeVillage.metrics ? activeVillage.metrics.projBusFreq : 2} trips/day<br/>Walk to stop: ${activeVillage.walkToBusStopKm} km`,
      highwayColor: '#eab308',
      tooltipText: `KSRTC Gramina Sarige route · ${activeVillage.currentBusFrequencyPerDay} → ${activeVillage.metrics ? activeVillage.metrics.projBusFreq : 2} trips/day`
    }
  ];

  const visibleDests = destinations.filter(d =>
    destinationMode === 'ALL' || destinationMode === d.modeKey
  );

  if (visibleDests.length === 0) return;

  const kutchaKm = activeVillage.roadLengthKm || 5;

  // Place all destination pins immediately (no async wait)
  visibleDests.forEach(({ destCoords, destLabel, destPopupHtml, highwayColor }) => {
    const destIcon = L.divIcon({
      className: '',
      html: `<div class="pin-badge" style="border-color:${highwayColor}">${destLabel}</div>`,
      iconSize: [200, 28], iconAnchor: [100, 14]
    });
    const destMarker = L.marker(destCoords, { icon: destIcon });
    if (destPopupHtml) destMarker.bindPopup(destPopupHtml);
    activeVillageGroup.addLayer(destMarker);
  });

  // Use the first visible destination to derive the shared kutcha segment,
  // then draw each destination's highway independently.
  const primaryDest = visibleDests[0];
  const [pLat, pLng] = primaryDest.destCoords;

  getRouteLegs(vLat, vLng, null, null, pLat, pLng, null, kutchaKm).then(({ kutcha }) => {
    if (!map || !activeVillageGroup) return;

    // ── Draw kutcha ONCE ───────────────────────────────────────────────────
    const kutchaLine = L.polyline(kutcha, {
      color: villageColor,
      weight: 5,
      dashArray: '10, 7',
      opacity: 1,
      lineCap: 'round'
    });
    kutchaLine.bindTooltip(
      `🔴 KUTCHA MISSING LINK — ${activeVillage.roadLengthKm} km · ${activeVillage.existingRoadType} · max ${activeVillage.maxCurrentSpeedKmh} km/h · ${activeVillage.monsoonIsolationDays} days/yr cut off`,
      { sticky: true }
    );
    activeVillageGroup.addLayer(kutchaLine);

    // ── Highway Join marker at the split point ─────────────────────────────
    const joinPt = kutcha[kutcha.length - 1];
    const jIcon = L.divIcon({
      className: '',
      html: `<div style="background:${villageColor};color:#fff;font-size:10px;font-weight:700;padding:3px 7px;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,.35);">🛑 Highway Join</div>`,
      iconSize: [110, 22], iconAnchor: [55, 11]
    });
    activeVillageGroup.addLayer(L.marker(joinPt, { icon: jIcon }));

    // ── Draw one highway segment per visible destination ───────────────────
    visibleDests.forEach(({ destCoords, highwayColor, tooltipText }) => {
      const [dLat, dLng] = destCoords;
      getRouteLegs(vLat, vLng, null, null, dLat, dLng, null, kutchaKm).then(({ highway }) => {
        if (!map || !activeVillageGroup) return;
        const highwayLine = L.polyline(highway, {
          color: highwayColor,
          weight: 4,
          opacity: 0.9,
          lineCap: 'round'
        });
        highwayLine.bindTooltip(`✅ EXISTING HIGHWAY — ${tooltipText}`, { sticky: true });
        activeVillageGroup.addLayer(highwayLine);
      });
    });
  });

  // Open active village marker popup automatically
  setTimeout(() => {
    activeMarker.openPopup();
  }, 300);
}

/**
 * Individual Village Map Inspector — Leaflet.js Implementation
 * Renders a real Karnataka map with OpenStreetMap tiles.
 * Plots village markers and route lines to Urban Hub, APMC Mandi, Hospital, Bus Stop.
 */

let map = null;
let villagesData = [];
let destinationMode = 'ALL';
let selectedVillageId = null;
let onSelectVillageCallback = null;

// Layers we clear on mode/village change
let routeLayerGroup = null;
let markerLayerGroup = null;

// Approximate hub GPS coordinates (used to draw route lines)
const HUB_COORDS = {
  // Urban hubs
  "Davangere Industrial & University Hub":         [14.4644, 75.9218],
  "Shivamogga Smart City & Industrial Zone":       [13.9299, 75.5681],
  "Bengaluru North Industrial Corridor (Peenya & Dobbaspet)": [13.0317, 77.5184],
  "Kalaburagi Regional Smart City":                [17.3297, 76.8343],
  "Mysuru Knowledge & Heritage Hub":               [12.2958, 76.6394],
  "Ballari Steel & Textile Corridor":              [15.1394, 76.9214],
  "Mysuru Industrial & Heritage Smart City":       [12.2958, 76.6394],
  "Hubballi-Dharwad Twin City Tech Cluster":       [15.3647, 75.1240],
  "Mangaluru Coastal Port & Education Hub":        [12.9141, 74.8560],
  "Bengaluru East Tech Corridor (Whitefield & ITPL)": [12.9698, 77.7500],
  "Belagavi Foundry & Aerospace Smart City":       [15.8497, 74.4977],
  "Davangere Textile & Education Hub":             [14.4644, 75.9218],
  // Fallback
  "default_urban":                                 [15.3173, 75.7139],

  // APMC Mandis
  "Chitradurga APMC Mandi":                        [14.2290, 76.3980],
  "Shivamogga APMC Market":                        [13.9299, 75.5681],
  "Tumakuru APMC Yard":                            [13.3409, 77.1010],
  "Kalaburagi APMC Pulse Market":                  [17.3297, 76.8343],
  "Hassan APMC Market":                            [13.0068, 76.1003],
  "Raichur APMC Rice Yard":                        [16.2120, 77.3566],
  "Chamarajanagar Market Yard":                    [11.9241, 76.9437],
  "Vijayapura Grape & Grain Market":               [16.8302, 75.7100],
  "Chikkamagaluru Coffee Board Mandi":             [13.3161, 75.7720],
  "Kolar Tomato APMC Yard (Asia Largest)":         [13.1360, 78.1294],
  "Belagavi APMC Market":                          [15.8497, 74.4977],
  "Davangere APMC Maize Market":                   [14.4644, 75.9218],
  "default_mandi":                                 [15.3173, 75.7139],

  // Hospitals
  "Chitradurga District Govt Hospital & Trauma Center": [14.2290, 76.3980],
  "McGann Teaching Hospital Shivamogga":           [13.9299, 75.5681],
  "Tumakuru District General Hospital & ICU":      [13.3409, 77.1010],
  "GIMS Govt Institute of Medical Sciences Kalaburagi": [17.3297, 76.8343],
  "HIMS Hassan Institute of Medical Sciences":     [13.0068, 76.1003],
  "RIMS Raichur Institute of Medical Sciences":    [16.2120, 77.3566],
  "CIMS Chamarajanagar Institute of Medical Sciences": [11.9241, 76.9437],
  "BLDE Shri B.M. Patil Medical College Hospital": [16.8302, 75.7100],
  "Chikkamagaluru District Govt Hospital":         [13.3161, 75.7720],
  "RL Jalappa Hospital & Research Center Kolar":   [13.1360, 78.1294],
  "KLE Prabhakar Kore Hospital Belagavi":          [15.8497, 74.4977],
  "SS Institute of Medical Sciences Davangere":    [14.4644, 75.9218],
  "default_hospital":                              [15.3173, 75.7139],
};

function getHubCoord(name, type) {
  if (HUB_COORDS[name]) return HUB_COORDS[name];
  return HUB_COORDS[`default_${type}`] || [15.3173, 75.7139];
}

export function initMapViewer(villages, onSelectVillage, initialMode = 'ALL') {
  villagesData = villages;
  destinationMode = initialMode;
  onSelectVillageCallback = onSelectVillage;

  if (villages.length > 0 && !selectedVillageId) {
    selectedVillageId = villages[0].id;
  }

  populateVillageDropdown();
  initLeafletMap();
  setupResetBtn();
}

export function setSelectedVillageOnMap(villageId) {
  selectedVillageId = villageId;
  const select = document.getElementById('individualVillageSelect');
  if (select) select.value = villageId;
  refreshMap();
}

export function setMapDestinationMode(mode) {
  destinationMode = mode;
  refreshMap();
}

function populateVillageDropdown() {
  const select = document.getElementById('individualVillageSelect');
  if (!select) return;

  select.innerHTML = villagesData.map(v => {
    const icon = v.roadConditionCategory === 'SEVERELY_BAD' ? '🔴' : '🟠';
    const cas = v.metrics?.accessibility?.current ?? '';
    return `<option value="${v.id}" ${v.id === selectedVillageId ? 'selected' : ''}>${icon} ${v.name} (${v.district}) — CAS: ${cas}/100</option>`;
  }).join('');

  select.onchange = (e) => {
    selectedVillageId = e.target.value;
    const village = villagesData.find(v => v.id === selectedVillageId);
    refreshMap();
    if (village && onSelectVillageCallback) onSelectVillageCallback(village);
  };
}

function initLeafletMap() {
  const container = document.getElementById('leafletMap');
  if (!container) return;

  // Destroy existing map instance if re-initialising
  if (map) {
    map.remove();
    map = null;
  }

  map = L.map('leafletMap', {
    center: [15.3173, 75.7139], // Karnataka centre
    zoom: 7,
    zoomControl: true,
  });

  // Dark CartoDB tile layer — matches the app's dark theme
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 18,
  }).addTo(map);

  routeLayerGroup = L.layerGroup().addTo(map);
  markerLayerGroup = L.layerGroup().addTo(map);

  // Plot all village markers
  villagesData.forEach(v => {
    if (!v.lat || !v.lng) return;
    const isSevere = v.roadConditionCategory === 'SEVERELY_BAD';
    const color = isSevere ? '#ef4444' : '#f59e0b';

    const icon = L.divIcon({
      className: '',
      html: `<div style="
        width:14px;height:14px;border-radius:50%;
        background:${color};border:2px solid #fff;
        box-shadow:0 0 8px ${color};
        cursor:pointer;
      "></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });

    const marker = L.marker([v.lat, v.lng], { icon })
      .addTo(markerLayerGroup)
      .bindTooltip(`<b>${v.name}</b><br>${v.district} — CAS: ${v.metrics?.accessibility?.current ?? '?'}/100`, {
        direction: 'top', offset: [0, -10],
        className: 'leaflet-tooltip-dark',
      });

    marker.on('click', () => {
      selectedVillageId = v.id;
      const sel = document.getElementById('individualVillageSelect');
      if (sel) sel.value = v.id;
      refreshMap();
      if (onSelectVillageCallback) onSelectVillageCallback(v);
    });
  });

  refreshMap();
}

function refreshMap() {
  if (!map) return;

  // Clear route lines
  if (routeLayerGroup) routeLayerGroup.clearLayers();

  const v = villagesData.find(x => x.id === selectedVillageId) || villagesData[0];
  if (!v || !v.lat || !v.lng) return;

  const vCoord = [v.lat, v.lng];
  const isSevere = v.roadConditionCategory === 'SEVERELY_BAD';

  // Draw routes based on mode
  if (destinationMode === 'ALL' || destinationMode === 'URBAN') {
    const dest = getHubCoord(v.nearestUrbanHub, 'urban');
    drawRoute(vCoord, dest, '#38bdf8', [8, 5], v.nearestUrbanHub, '🏙️ Urban Hub');
    addHubMarker(dest, '#38bdf8', `🏙️ ${v.nearestUrbanHub}`, `${v.currentUrbanTravelTimeMin}min → ${v.postUrbanTravelTimeMin}min`);
  }

  if (destinationMode === 'ALL' || destinationMode === 'MANDI') {
    const dest = getHubCoord(v.nearestMandi, 'mandi');
    drawRoute(vCoord, dest, '#a855f7', [6, 4], v.nearestMandi, '🌾 APMC Mandi');
    addHubMarker(dest, '#a855f7', `🌾 ${v.nearestMandi}`, `Crop: ${v.primaryCrop}`);
  }

  if (destinationMode === 'ALL' || destinationMode === 'HOSPITAL') {
    const dest = getHubCoord(v.nearestHospitalHub, 'hospital');
    drawRoute(vCoord, dest, '#f43f5e', [4, 4], v.nearestHospitalHub, '🏥 Hospital');
    addHubMarker(dest, '#f43f5e', `🏥 ${v.nearestHospitalHub}`, `${v.currentHospitalTravelTimeMin}min → ${v.postHospitalTravelTimeMin}min`);
  }

  if (destinationMode === 'ALL' || destinationMode === 'BUS') {
    // KSRTC bus stop is near the state highway — offset slightly from village
    const busCoord = [v.lat + 0.08, v.lng + 0.12];
    drawRoute(vCoord, busCoord, '#f59e0b', [5, 3], `${v.ksrtcDivision}`, '🚌 Bus Stop');
    addHubMarker(busCoord, '#f59e0b', `🚌 ${v.ksrtcDivision}`, `${v.currentBusFrequencyPerDay} → ${v.projectedBusFrequencyPerDay} trips/day`);
  }

  // Highlight selected village marker with a larger pulsing icon
  const selIcon = L.divIcon({
    className: '',
    html: `<div style="
      width:22px;height:22px;border-radius:50%;
      background:${isSevere ? '#ef4444' : '#f59e0b'};
      border:3px solid #fff;
      box-shadow:0 0 0 6px ${isSevere ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}, 0 0 18px ${isSevere ? '#ef4444' : '#f59e0b'};
    "></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });

  L.marker(vCoord, { icon: selIcon, zIndexOffset: 1000 })
    .addTo(routeLayerGroup)
    .bindPopup(`
      <div style="min-width:200px">
        <b style="font-size:14px">${v.name}</b><br>
        <span style="color:#94a3b8">${v.district}, ${v.state}</span><br><br>
        <b>Population:</b> ${v.population.toLocaleString()}<br>
        <b>Road:</b> ${v.existingRoadType}<br>
        <b>Monsoon cut-off:</b> ${v.monsoonIsolationDays} days/yr<br>
        <b>CAS:</b> ${v.metrics?.accessibility?.current ?? '?'} → ${v.metrics?.accessibility?.projected ?? '?'}/100<br>
        <b>10-yr ROI:</b> ${v.metrics?.roiPerCrore ?? '?'}x
      </div>
    `, { maxWidth: 260 })
    .openPopup();

  // Fly to selected village
  map.flyTo(vCoord, 10, { duration: 1.2 });
}

function drawRoute(from, to, color, dashArray, label, typeLabel) {
  const line = L.polyline([from, to], {
    color,
    weight: 2.5,
    opacity: 0.85,
    dashArray: dashArray.join(' '),
  }).addTo(routeLayerGroup);

  line.bindTooltip(`${typeLabel}: ${label}`, {
    sticky: true,
    className: 'leaflet-tooltip-dark',
  });
}

function addHubMarker(coord, color, title, subtitle) {
  const icon = L.divIcon({
    className: '',
    html: `<div style="
      width:10px;height:10px;border-radius:50%;
      background:${color};border:2px solid rgba(255,255,255,0.7);
      box-shadow:0 0 6px ${color};
    "></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  });

  L.marker(coord, { icon })
    .addTo(routeLayerGroup)
    .bindTooltip(`<b>${title}</b><br>${subtitle}`, {
      direction: 'top', offset: [0, -8],
      className: 'leaflet-tooltip-dark',
    });
}

function setupResetBtn() {
  const btn = document.getElementById('btnResetMap');
  if (btn) {
    btn.onclick = () => {
      if (map) map.flyTo([15.3173, 75.7139], 7, { duration: 1 });
    };
  }
}

/**
 * Individual Village Map Inspector Component
 * Dedicated 1-on-1 HTML5 Canvas Spatial Map Renderer centered on a single selected village.
 * Visualizes individual multi-sector routes (Urban Hub, APMC Mandi, Emergency Hospital, KSRTC Bus).
 */

let canvas, ctx;
let selectedVillageId = null;
let villagesData = [];
let destinationMode = 'ALL';
let scale = 1;
let offsetX = 0;
let offsetY = 0;
let isDragging = false;
let startX, startY;

export function initMapViewer(villages, onSelectVillage, initialMode = 'ALL') {
  canvas = document.getElementById('mapCanvas');
  if (!canvas) return;

  ctx = canvas.getContext('2d');
  villagesData = villages;
  destinationMode = initialMode;

  if (villages.length > 0 && !selectedVillageId) {
    selectedVillageId = villages[0].id;
  }

  populateVillageDropdown(onSelectVillage);
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  setupInteractions(onSelectVillage);
  renderMap();
}

export function setSelectedVillageOnMap(villageId) {
  selectedVillageId = villageId;
  const select = document.getElementById('individualVillageSelect');
  if (select) select.value = villageId;
  renderMap();
}

export function setMapDestinationMode(mode) {
  destinationMode = mode;
  renderMap();
}

function populateVillageDropdown(onSelectVillage) {
  const select = document.getElementById('individualVillageSelect');
  if (!select) return;

  select.innerHTML = villagesData.map(v => {
    const isBad = v.roadConditionCategory === 'SEVERELY_BAD' ? '🔴' : '🟠';
    return `<option value="${v.id}" ${v.id === selectedVillageId ? 'selected' : ''}>${isBad} ${v.name} (${v.district}) - CAS: ${v.metrics.accessibility ? v.metrics.accessibility.current : ''}/100</option>`;
  }).join('');

  select.onchange = (e) => {
    selectedVillageId = e.target.value;
    const village = villagesData.find(v => v.id === selectedVillageId);
    renderMap();
    if (village && onSelectVillage) {
      onSelectVillage(village);
    }
  };
}

function resizeCanvas() {
  const container = canvas.parentElement;
  if (!container) return;
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
  renderMap();
}

function setupInteractions(onSelectVillage) {
  canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX - offsetX;
    startY = e.clientY - offsetY;
  });

  window.addEventListener('mouseup', () => { isDragging = false; });

  canvas.addEventListener('mousemove', (e) => {
    if (isDragging) {
      offsetX = e.clientX - startX;
      offsetY = e.clientY - startY;
      renderMap();
    }
  });

  const btnZoomIn = document.getElementById('btnZoomIn');
  const btnZoomOut = document.getElementById('btnZoomOut');
  const btnResetMap = document.getElementById('btnResetMap');

  if (btnZoomIn) btnZoomIn.onclick = () => { scale *= 1.2; renderMap(); };
  if (btnZoomOut) btnZoomOut.onclick = () => { scale /= 1.2; renderMap(); };
  if (btnResetMap) btnResetMap.onclick = () => { scale = 1; offsetX = 0; offsetY = 0; renderMap(); };
}

function renderMap() {
  if (!ctx || !canvas) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();

  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);

  // 1. Canvas Dark Grid Background
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;
  const gridSize = 40;
  for (let x = 0; x < canvas.width * 2; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height * 2);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height * 2; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width * 2, y);
    ctx.stroke();
  }

  // Active Selected Village
  const activeVillage = villagesData.find(v => v.id === selectedVillageId) || villagesData[0];
  if (!activeVillage) {
    ctx.restore();
    return;
  }

  const v = activeVillage;
  const m = v.metrics;
  const isSeverelyBad = v.roadConditionCategory === 'SEVERELY_BAD';
  const cas = m.accessibility || { current: 20, projected: 85 };

  // Center Coordinates for Village Node
  const vX = canvas.width / 2;
  const vY = canvas.height / 2;

  // Relative Coordinates for Destination Network Nodes
  const junctionNode = { x: vX + 110, y: vY - 45, name: 'State Highway Junction' };
  const urbanNode = { x: vX + 240, y: vY - 110, name: v.nearestUrbanHub || 'Urban Centre' };
  const mandiNode = { x: vX - 220, y: vY - 130, name: v.nearestMandi || 'APMC Mandi' };
  const hospitalNode = { x: vX - 210, y: vY + 140, name: v.nearestHospitalHub || 'District Hospital' };
  const busNode = { x: vX + 210, y: vY + 135, name: `${v.ksrtcDivision || 'KSRTC'} Bus Stop` };

  // --- DRAW ROUTES & CONNECTIONS ---

  // Pillar 1 & 2: Urban Centre & Highway Corridor
  if (destinationMode === 'ALL' || destinationMode === 'URBAN') {
    // Unpaved Bad Track to Highway Junction (Red/Orange Alert)
    ctx.beginPath();
    ctx.moveTo(vX, vY);
    ctx.lineTo(junctionNode.x, junctionNode.y);
    ctx.strokeStyle = isSeverelyBad ? '#ef4444' : '#f59e0b';
    ctx.lineWidth = 3.5;
    ctx.setLineDash([6, 4]);
    ctx.stroke();

    // Highway Junction Node
    ctx.beginPath();
    ctx.arc(junctionNode.x, junctionNode.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = isSeverelyBad ? '#ef4444' : '#f59e0b';
    ctx.fill();

    // Paved Highway Segment to Urban Place (Cyan Solid Route)
    ctx.beginPath();
    ctx.moveTo(junctionNode.x, junctionNode.y);
    ctx.lineTo(urbanNode.x, urbanNode.y);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    ctx.stroke();

    // Flow Arrow
    const angle = Math.atan2(urbanNode.y - junctionNode.y, urbanNode.x - junctionNode.x);
    const arrowX = junctionNode.x + (urbanNode.x - junctionNode.x) * 0.5;
    const arrowY = junctionNode.y + (urbanNode.y - junctionNode.y) * 0.5;

    ctx.save();
    ctx.translate(arrowX, arrowY);
    ctx.rotate(angle);
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(-8, -4); ctx.lineTo(-8, 4); ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Distance Callout
    drawRouteBadge(ctx, (vX + junctionNode.x) / 2, (vY + junctionNode.y) / 2 - 12, `🔴 ${v.roadLengthKm}km Bad Track`, isSeverelyBad ? '#ef4444' : '#f59e0b');
    drawNodeBadge(ctx, urbanNode.x, urbanNode.y, `🏙️ ${urbanNode.name}`, `Commute: -${m.urbanTimeSavedHrs} hrs saved`, '#38bdf8');
  }

  // Pillar 3: APMC Agricultural Mandi Route (Purple Dashed Line)
  if (destinationMode === 'ALL' || destinationMode === 'MANDI') {
    ctx.beginPath();
    ctx.moveTo(vX, vY);
    ctx.lineTo(mandiNode.x, mandiNode.y);
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    drawNodeBadge(ctx, mandiNode.x, mandiNode.y, `🌾 APMC: ${mandiNode.name}`, `Crop: ${v.primaryCrop} (-${m.timeSavedHrs}h)`, '#a855f7');
  }

  // Pillar 4: Emergency Hospital ICU Route (Rose Red Dashed Line)
  if (destinationMode === 'ALL' || destinationMode === 'HOSPITAL') {
    ctx.beginPath();
    ctx.moveTo(vX, vY);
    ctx.lineTo(hospitalNode.x, hospitalNode.y);
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    drawNodeBadge(ctx, hospitalNode.x, hospitalNode.y, `🏥 Hospital: ${hospitalNode.name}`, `Emergency: -${m.hospitalTimeSavedHrs} hrs saved`, '#f43f5e');
  }

  // Pillar 5: KSRTC Public Bus Route (Gold/Amber Dashed Line)
  if (destinationMode === 'ALL' || destinationMode === 'BUS') {
    ctx.beginPath();
    ctx.moveTo(vX, vY);
    ctx.lineTo(busNode.x, busNode.y);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([4, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    drawNodeBadge(ctx, busNode.x, busNode.y, `🚌 ${busNode.name}`, `Bus: ${m.currentBusFreq} ➔ ${m.projBusFreq} trips/day`, '#f59e0b');
  }

  // --- CENTER VILLAGE NODE ---

  // Glow Halo
  ctx.beginPath();
  ctx.arc(vX, vY, 20, 0, Math.PI * 2);
  ctx.fillStyle = isSeverelyBad ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)';
  ctx.fill();

  // Core Circle
  ctx.beginPath();
  ctx.arc(vX, vY, 12, 0, Math.PI * 2);
  ctx.fillStyle = isSeverelyBad ? '#ef4444' : '#f59e0b';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Village Header Label Box
  const villageTitle = `🏡 ${v.name} (${v.district})`;
  const subTitle = `CAS Score: ${cas.current}/100 ➔ ${cas.projected}/100 • ${v.monsoonIsolationDays}d monsoon cut-off`;

  ctx.font = '800 13px Plus Jakarta Sans';
  const titleWidth = ctx.measureText(villageTitle).width;
  ctx.font = '600 10px Plus Jakarta Sans';
  const subWidth = ctx.measureText(subTitle).width;
  const boxWidth = Math.max(titleWidth, subWidth) + 24;

  ctx.fillStyle = 'rgba(5, 8, 17, 0.95)';
  ctx.strokeStyle = isSeverelyBad ? '#ef4444' : '#f59e0b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(vX - boxWidth / 2, vY - 58, boxWidth, 40, 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 12px Plus Jakarta Sans';
  ctx.fillText(villageTitle, vX - titleWidth / 2, vY - 40);

  ctx.fillStyle = isSeverelyBad ? '#fca5a5' : '#fef08a';
  ctx.font = '600 10px Plus Jakarta Sans';
  ctx.fillText(subTitle, vX - subWidth / 2, vY - 24);

  ctx.restore();
}

function drawNodeBadge(ctx, x, y, title, subtitle, color) {
  ctx.font = '700 11px Plus Jakarta Sans';
  const titleW = ctx.measureText(title).width;
  ctx.font = '500 10px Plus Jakarta Sans';
  const subW = ctx.measureText(subtitle).width;
  const w = Math.max(titleW, subW) + 20;

  ctx.fillStyle = 'rgba(5, 8, 17, 0.9)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - 28, w, 34, 8);
  ctx.fill();
  ctx.stroke();

  // Node Point
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 11px Plus Jakarta Sans';
  ctx.fillText(title, x - titleW / 2, y - 14);

  ctx.fillStyle = color;
  ctx.font = '500 10px Plus Jakarta Sans';
  ctx.fillText(subtitle, x - subW / 2, y - 2);
}

function drawRouteBadge(ctx, x, y, text, color) {
  ctx.font = '600 10px Plus Jakarta Sans';
  const w = ctx.measureText(text).width + 14;

  ctx.fillStyle = 'rgba(5, 8, 17, 0.9)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - 8, w, 18, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.fillText(text, x - w / 2 + 7, y + 4);
}

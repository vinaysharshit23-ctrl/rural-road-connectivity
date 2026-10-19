/**
 * MotionSites 4-Column Card Grid Component
 * Renders unconnected villages as MotionSites prompt showcase cards with:
 * - rounded-3xl container with prompt-card-hover
 * - aspect-[4/3] rounded-xl preview thumbnail with topographic route visualization & shimmer
 * - rank & metric floating badges
 * - bold typography & category tags
 * - quick inspect action buttons
 */

export function renderVillageCardGrid(villages, onInspectVillage) {
  const gridContainer = document.getElementById('villageCardGrid');
  if (!gridContainer) return;

  if (villages.length === 0) {
    gridContainer.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 2rem; color: var(--text-muted); background: var(--bg-card); border-radius: 24px; border: 1px solid var(--border-glass)">
        <div style="font-size: 2.5rem; margin-bottom: 0.75rem">🔍</div>
        <div style="font-size: 1.1rem; font-weight: 700; color: #fff; margin-bottom: 0.25rem">No habitations found</div>
        <p style="font-size: 0.85rem; color: var(--text-secondary)">No villages match your current filters. Try resetting the search or category filters.</p>
      </div>
    `;
    return;
  }

  // Sort by MAI priority score descending
  const sorted = [...villages].sort((a, b) => (b.metrics?.maiScore || 0) - (a.metrics?.maiScore || 0));

  gridContainer.innerHTML = sorted.map((v, index) => {
    const rank = index + 1;
    const score = v.metrics?.maiScore || 0;
    const roi = v.metrics?.roiPerCrore || 2.1;
    const timeSaved = v.metrics?.timeSavedHrs ? Math.round(v.metrics.timeSavedHrs * 60) : Math.max(15, v.currentTravelTimeMin - v.postRoadTravelTimeMin);
    const isCritical = v.roadConditionCategory === 'SEVERELY_BAD';
    const conditionTag = isCritical ? 'Critical Bad' : 'Poor Surface';
    const conditionColor = isCritical ? '#f43f5e' : '#f59e0b';
    const conditionBg = isCritical ? 'rgba(244, 63, 94, 0.16)' : 'rgba(245, 158, 11, 0.16)';

    // Dynamic Topographic Route SVG Thumbnail
    const svgId = `topo-${v.id || index}`;
    const startX = 35 + ((index * 13) % 40);
    const startY = 120 - ((index * 7) % 30);
    const endX = 220 - ((index * 11) % 40);
    const endY = 40 + ((index * 9) % 30);
    const midX = (startX + endX) / 2 + (((index % 2 === 0 ? 1 : -1) * 25));
    const midY = (startY + endY) / 2 + (((index % 3 === 0 ? -1 : 1) * 20));

    const pathData = `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`;

    return `
      <div class="ms-card prompt-card-hover" data-village-id="${v.id}" id="card-${v.id}">
        <!-- MotionSites aspect-[4/3] preview container -->
        <div class="ms-card-preview">
          <!-- Ambient Shimmer -->
          <div class="ms-card-shimmer"></div>
          
          <!-- Topographic Map Canvas SVG -->
          <svg class="ms-card-svg" viewBox="0 0 260 160" preserveAspectRatio="none">
            <defs>
              <pattern id="grid-${index}" width="16" height="16" patternUnits="userSpaceOnUse">
                <path d="M 16 0 L 0 0 0 16" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
              </pattern>
              <linearGradient id="routeGrad-${index}" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="${conditionColor}" stop-opacity="0.9"/>
                <stop offset="60%" stop-color="#22d3ee" stop-opacity="0.95"/>
                <stop offset="100%" stop-color="#10b981" stop-opacity="1"/>
              </linearGradient>
              <filter id="glow-${index}" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            <!-- Background Grid -->
            <rect width="100%" height="100%" fill="#061217" />
            <rect width="100%" height="100%" fill="url(#grid-${index})" />

            <!-- Contour Elevation Lines -->
            <path d="M 0 40 Q 60 20 130 50 T 260 30" fill="none" stroke="rgba(34, 211, 238, 0.08)" stroke-width="1" />
            <path d="M 0 90 Q 70 70 140 100 T 260 80" fill="none" stroke="rgba(34, 211, 238, 0.08)" stroke-width="1" />
            <path d="M 0 130 Q 90 120 170 140 T 260 125" fill="none" stroke="rgba(34, 211, 238, 0.08)" stroke-width="1" />

            <!-- Glow Route Path -->
            <path d="${pathData}" fill="none" stroke="${conditionColor}" stroke-width="4" stroke-opacity="0.4" filter="url(#glow-${index})" />
            <path d="${pathData}" fill="none" stroke="url(#routeGrad-${index})" stroke-width="2.5" stroke-dasharray="4,3" />

            <!-- Village Start Node -->
            <circle cx="${startX}" cy="${startY}" r="6" fill="${conditionColor}" />
            <circle cx="${startX}" cy="${startY}" r="10" fill="none" stroke="${conditionColor}" stroke-opacity="0.4" />
            <text x="${startX + 10}" y="${startY + 4}" fill="#ffffff" font-size="10" font-weight="700" font-family="'Plus Jakarta Sans', sans-serif">${v.name}</text>

            <!-- Destination Node (Mandi / Hub) -->
            <circle cx="${endX}" cy="${endY}" r="5" fill="#10b981" />
            <circle cx="${endX}" cy="${endY}" r="9" fill="none" stroke="#10b981" stroke-opacity="0.4" />
            <text x="${endX - 8}" y="${endY - 9}" fill="#99f6e4" font-size="9" font-weight="600" text-anchor="end" font-family="'Plus Jakarta Sans', sans-serif">${v.nearestMandi || 'APMC Mandi'}</text>
          </svg>

          <!-- Floating Badges on Preview -->
          <div class="ms-preview-badges">
            <span class="ms-badge-rank">#${rank}</span>
            <span class="ms-badge-score">Score ${score}</span>
          </div>

          <!-- Bottom Floating Metrics on Preview -->
          <div class="ms-preview-bottom-pill">
            <span style="color: ${conditionColor}; font-weight: 700">● ${conditionTag}</span>
            <span style="color: rgba(255,255,255,0.4)">|</span>
            <span style="color: #22d3ee">⏱️ -${timeSaved}m</span>
            <span style="color: rgba(255,255,255,0.4)">|</span>
            <span style="color: #10b981">📈 ${roi}x ROI</span>
          </div>
        </div>

        <!-- MotionSites Card Details Footer -->
        <div class="ms-card-footer">
          <div class="ms-card-info">
            <h3 class="ms-card-title">${v.name}</h3>
            <span class="ms-card-sub">${v.taluk ? v.taluk + ', ' : ''}${v.district} • ${v.primaryCrop} • Pop ${v.population.toLocaleString()}</span>
          </div>

          <div class="ms-card-actions">
            <button class="ms-action-btn" title="Inspect Habitation Details & Spatial Route" data-village-btn="${v.id}" aria-label="Inspect Habitation">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Wire click events to inspect modal
  const cards = gridContainer.querySelectorAll('.ms-card');
  cards.forEach(card => {
    card.addEventListener('click', (e) => {
      const villageId = card.getAttribute('data-village-id');
      const targetVillage = villages.find(v => String(v.id) === String(villageId));
      if (targetVillage && onInspectVillage) {
        onInspectVillage(targetVillage);
      }
    });
  });
}

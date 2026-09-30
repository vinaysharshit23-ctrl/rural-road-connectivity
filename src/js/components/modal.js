/**
 * Village Inspector Modal Component
 * Displays deep-dive economic, agri, urban job/college, hospital healthcare,
 * AND explicit Road Condition Category breakdown (Severely Bad vs Bad).
 */

export function openVillageModal(village) {
  const modalOverlay = document.getElementById('villageModalOverlay');
  const modalBody = document.getElementById('modalBodyContent');
  if (!modalOverlay || !modalBody) return;

  const m = village.metrics;
  const isSeverelyBad = village.roadConditionCategory === 'SEVERELY_BAD';

  const cas = m.accessibility || {
    current: 22.4,
    projected: 86.8,
    gain: 64.4,
    breakdown: {
      urban: { pre: 25, post: 85 },
      road: { pre: 15, post: 95 },
      majorRoad: { pre: 30, post: 98 },
      health: { pre: 20, post: 85 },
      edu: { pre: 35, post: 85 },
      market: { pre: 25, post: 88 },
      transit: { pre: 10, post: 80 }
    }
  };

  modalBody.innerHTML = `
    <div style="margin-bottom: 1.25rem">
      <div style="display: flex; justify-content: space-between; align-items: flex-start">
        <div>
          <span style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--accent-cyan); text-transform: uppercase">${village.id} • ${village.regionCode || 'INDIA'}</span>
          <h2 style="font-size: 1.6rem; font-weight: 800; color: #fff; margin-top: 0.2rem">${village.name}</h2>
          <div style="color: var(--text-secondary); font-size: 0.9rem">${village.district} District, ${village.state}</div>
        </div>
        <div style="text-align: right; display: flex; gap: 0.5rem">
          <div class="badge ${m.maiScore >= 75 ? 'mai-high' : (m.maiScore >= 50 ? 'mai-medium' : 'mai-standard')}" style="font-size: 0.85rem; padding: 0.4rem 0.75rem">
            MAI Score: ${m.maiScore} / 100
          </div>
          <div class="badge" style="background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.5); color: #fca5a5; font-size: 0.85rem; padding: 0.4rem 0.75rem">
            CAS: ${cas.current} ➔ ${cas.projected} (+${cas.gain})
          </div>
        </div>
      </div>
    </div>

    <!-- 7-Pillar Comprehensive Accessibility Score (CAS) Matrix -->
    <div style="background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(56, 189, 248, 0.35); border-radius: 14px; padding: 1.25rem; margin-bottom: 1.5rem">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem">
        <div>
          <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--accent-cyan); letter-spacing: 0.05em">
            🎯 Comprehensive Accessibility Score (CAS) Matrix
          </div>
          <div style="font-size: 1.15rem; font-weight: 800; color: #fff; margin-top: 0.15rem">
            Current Accessibility: <span style="color: #ef4444">${cas.current} / 100</span> <span style="color: var(--text-muted); font-size: 0.85rem">(Critical Deficit)</span>
            ➔ Projected: <span style="color: var(--accent-emerald)">${cas.projected} / 100 (+${cas.gain} pts gain)</span>
          </div>
        </div>
        <div style="text-align: right; background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); padding: 0.4rem 0.85rem; border-radius: 8px">
          <div style="font-size: 0.7rem; color: var(--text-muted)">Overall Deficit Reduction</div>
          <div style="font-family: var(--font-mono); font-weight: 700; color: var(--accent-emerald); font-size: 1rem">+${((cas.gain / (100 - cas.current)) * 100).toFixed(0)}% Resolved</div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.85rem 1.25rem; background: rgba(0,0,0,0.3); padding: 0.9rem 1.1rem; border-radius: 10px; font-size: 0.82rem">
        <!-- Pillar 1: Urban Centre -->
        <div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.2rem">
            <span style="color: #cbd5e1">🏙️ Urban Centre Access Sub-Score:</span>
            <span style="font-weight: 700"><span style="color: #ef4444">${cas.breakdown.urban.pre}/100</span> ➔ <span style="color: var(--accent-emerald)">${cas.breakdown.urban.post}/100</span> <span style="font-size: 0.72rem; color: var(--text-muted)">(${village.currentUrbanTravelTimeMin}m ➔ ${village.postUrbanTravelTimeMin}m)</span></span>
          </div>
          <div style="height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden">
            <div style="height: 100%; width: ${cas.breakdown.urban.post}%; background: linear-gradient(90deg, #ef4444, #38bdf8); border-radius: 3px"></div>
          </div>
        </div>

        <!-- Pillar 2: Road Condition -->
        <div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.2rem">
            <span style="color: #cbd5e1">🛠️ Road Condition & Seasonality:</span>
            <span style="font-weight: 700"><span style="color: #ef4444">${cas.breakdown.road.pre}/100</span> ➔ <span style="color: var(--accent-emerald)">${cas.breakdown.road.post}/100</span></span>
          </div>
          <div style="height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden">
            <div style="height: 100%; width: ${cas.breakdown.road.post}%; background: linear-gradient(90deg, #ef4444, #10b981); border-radius: 3px"></div>
          </div>
        </div>

        <!-- Pillar 3: Major Road Dist -->
        <div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.2rem">
            <span style="color: #cbd5e1">🛣️ Distance to Highway Sub-Score:</span>
            <span style="font-weight: 700"><span style="color: #ef4444">${cas.breakdown.majorRoad.pre}/100</span> ➔ <span style="color: var(--accent-emerald)">${cas.breakdown.majorRoad.post}/100</span> <span style="font-size: 0.72rem; color: var(--text-muted)">(${village.roadLengthKm}km track)</span></span>
          </div>
          <div style="height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden">
            <div style="height: 100%; width: ${cas.breakdown.majorRoad.post}%; background: linear-gradient(90deg, #f59e0b, #10b981); border-radius: 3px"></div>
          </div>
        </div>

        <!-- Pillar 4: Healthcare -->
        <div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.2rem">
            <span style="color: #cbd5e1">🏥 Hospital Emergency Sub-Score:</span>
            <span style="font-weight: 700"><span style="color: #ef4444">${cas.breakdown.health.pre}/100</span> ➔ <span style="color: var(--accent-emerald)">${cas.breakdown.health.post}/100</span> <span style="font-size: 0.72rem; color: var(--text-muted)">(${village.currentHospitalTravelTimeMin}m ➔ ${village.postHospitalTravelTimeMin}m)</span></span>
          </div>
          <div style="height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden">
            <div style="height: 100%; width: ${cas.breakdown.health.post}%; background: linear-gradient(90deg, #f43f5e, #10b981); border-radius: 3px"></div>
          </div>
        </div>

        <!-- Pillar 5: Education -->
        <div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.2rem">
            <span style="color: #cbd5e1">🏫 School & College Sub-Score:</span>
            <span style="font-weight: 700"><span style="color: #ef4444">${cas.breakdown.edu.pre}/100</span> ➔ <span style="color: var(--accent-emerald)">${cas.breakdown.edu.post}/100</span></span>
          </div>
          <div style="height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden">
            <div style="height: 100%; width: ${cas.breakdown.edu.post}%; background: linear-gradient(90deg, #f59e0b, #38bdf8); border-radius: 3px"></div>
          </div>
        </div>

        <!-- Pillar 6: Markets -->
        <div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.2rem">
            <span style="color: #cbd5e1">🌾 APMC Mandi Access Sub-Score:</span>
            <span style="font-weight: 700"><span style="color: #ef4444">${cas.breakdown.market.pre}/100</span> ➔ <span style="color: var(--accent-emerald)">${cas.breakdown.market.post}/100</span> <span style="font-size: 0.72rem; color: var(--text-muted)">(${village.currentTravelTimeMin}m ➔ ${village.postRoadTravelTimeMin}m)</span></span>
          </div>
          <div style="height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden">
            <div style="height: 100%; width: ${cas.breakdown.market.post}%; background: linear-gradient(90deg, #ef4444, #10b981); border-radius: 3px"></div>
          </div>
        </div>

        <!-- Pillar 7: Public Transit -->
        <div style="grid-column: span 2">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.2rem">
            <span style="color: #cbd5e1">🚌 KSRTC Public Bus Sub-Score:</span>
            <span style="font-weight: 700"><span style="color: #ef4444">${cas.breakdown.transit.pre}/100</span> ➔ <span style="color: var(--accent-emerald)">${cas.breakdown.transit.post}/100</span> <span style="font-size: 0.72rem; color: var(--text-muted)">(${m.currentBusFreq} ➔ ${m.projBusFreq} buses/day)</span></span>
          </div>
          <div style="height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden">
            <div style="height: 100%; width: ${cas.breakdown.transit.post}%; background: linear-gradient(90deg, #f59e0b, #10b981); border-radius: 3px"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Road Condition Audit Highlight Card -->
    <div style="background: ${isSeverelyBad ? 'rgba(244,63,94,0.1)' : 'rgba(245,158,11,0.1)'}; border: 1px solid ${isSeverelyBad ? 'rgba(244,63,94,0.35)' : 'rgba(245,158,11,0.35)'}; border-radius: 14px; padding: 1.25rem; margin-bottom: 1.5rem">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem">
        <div style="display: flex; align-items: center; gap: 0.6rem">
          <span style="font-size: 1.4rem">${isSeverelyBad ? '🔴' : '🟠'}</span>
          <div>
            <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: ${isSeverelyBad ? '#fb7185' : '#fbbf24'}">
              Existing Road Condition Category
            </div>
            <div style="font-size: 1.15rem; font-weight: 800; color: #fff">
              ${village.roadConditionLabel || (isSeverelyBad ? 'Severely Bad (Critical Mud/Flooded)' : 'Bad Surface (Poor Gravel/Bitumen)')}
            </div>
          </div>
        </div>
        <div style="text-align: right">
          <div style="font-family: var(--font-mono); font-size: 1.1rem; font-weight: 700; color: ${isSeverelyBad ? '#fb7185' : '#fbbf24'}">
            Grade: ${isSeverelyBad ? 'F (Critical)' : 'D- (Poor)'}
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted)">Surface: ${village.existingRoadType}</div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; background: rgba(0,0,0,0.3); padding: 0.85rem; border-radius: 10px; font-size: 0.85rem">
        <div>
          <span style="color: var(--text-muted)">🌧️ Monsoon Cut-Off:</span>
          <div style="font-family: var(--font-mono); font-weight: 700; color: #fb7185; margin-top: 0.15rem">${village.monsoonIsolationDays} Days / Year</div>
        </div>
        <div>
          <span style="color: var(--text-muted)">🚗 Max Safe Speed:</span>
          <div style="font-family: var(--font-mono); font-weight: 700; color: #fbbf24; margin-top: 0.15rem">${village.maxCurrentSpeedKmh} km/h (Current) ➔ 55 km/h (Post-Road)</div>
        </div>
        <div>
          <span style="color: var(--text-muted)">📏 Road Corridor Length:</span>
          <div style="font-family: var(--font-mono); font-weight: 700; color: var(--accent-cyan); margin-top: 0.15rem">${village.roadLengthKm} km (₹${village.estCostLakhs} Lakhs)</div>
        </div>
      </div>
    </div>

    <!-- Key Metrics Highlight Grid -->
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem">
      <div style="background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.25); border-radius: 12px; padding: 1rem; text-align: center">
        <div style="font-size: 0.75rem; color: var(--text-muted)">10-Year ROI Multiplier</div>
        <div style="font-family: var(--font-mono); font-size: 1.6rem; font-weight: 700; color: var(--accent-emerald); margin: 0.2rem 0">${m.roiPerCrore}x</div>
        <div style="font-size: 0.72rem; color: var(--accent-emerald)">₹${m.tenYearBenefitLakhs}L Total Benefit</div>
      </div>

      <div style="background: rgba(244,63,94,0.08); border: 1px solid rgba(244,63,94,0.25); border-radius: 12px; padding: 1rem; text-align: center">
        <div style="font-size: 0.75rem; color: var(--text-muted)">Hospital Emergency Transit</div>
        <div style="font-family: var(--font-mono); font-size: 1.6rem; font-weight: 700; color: var(--accent-rose); margin: 0.2rem 0">-${m.hospitalTimeSavedHrs} hrs</div>
        <div style="font-size: 0.72rem; color: var(--accent-rose)">Saved ${m.hospitalTimeSavedPercent}% emergency travel</div>
      </div>

      <div style="background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.25); border-radius: 12px; padding: 1rem; text-align: center">
        <div style="font-size: 0.75rem; color: var(--text-muted)">Est. Construction Cost</div>
        <div style="font-family: var(--font-mono); font-size: 1.6rem; font-weight: 700; color: var(--accent-amber); margin: 0.2rem 0">₹${village.estCostLakhs} L</div>
        <div style="font-size: 0.72rem; color: var(--accent-amber)">${village.roadLengthKm} km Road Length</div>
      </div>
    </div>

    <!-- 3-Pillar Access Breakdown -->
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem">
      <!-- Agri Produce -->
      <div style="background: rgba(9,13,22,0.6); border: 1px solid var(--border-glass); border-radius: 12px; padding: 1.1rem">
        <h4 style="font-size: 0.85rem; color: var(--text-primary); margin-bottom: 0.75rem">🌾 APMC Market Access</h4>
        <div class="stat-row">
          <span class="stat-label">Produce:</span>
          <span class="stat-val" style="font-size: 0.78rem">${village.primaryCrop}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Mandi:</span>
          <span class="stat-val" style="font-size: 0.75rem">${village.nearestMandi}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Travel Saved:</span>
          <span class="stat-val" style="color: var(--accent-emerald)">-${m.timeSavedHrs} hrs</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Loss Prevented:</span>
          <span class="stat-val" style="color: var(--accent-emerald)">₹${m.annualAgriSavedLakhs}L / yr</span>
        </div>
      </div>

      <!-- Urban Jobs & Education -->
      <div style="background: rgba(9,13,22,0.6); border: 1px solid var(--border-glass); border-radius: 12px; padding: 1.1rem">
        <h4 style="font-size: 0.85rem; color: var(--text-primary); margin-bottom: 0.75rem">🏙️ Urban Job & School Hub</h4>
        <div class="stat-row">
          <span class="stat-label">Urban Hub:</span>
          <span class="stat-val" style="color: var(--accent-cyan); font-size: 0.75rem">${village.nearestUrbanHub}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Commute Saved:</span>
          <span class="stat-val" style="color: var(--accent-cyan)">-${m.urbanTimeSavedHrs} hrs</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Job Focus:</span>
          <span class="stat-val" style="font-size: 0.72rem">${village.primaryUrbanOpportunity}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Wage Gain:</span>
          <span class="stat-val" style="color: var(--accent-cyan)">₹${m.annualUrbanJobCommuteLakhs}L / yr</span>
        </div>
      </div>

      <!-- Emergency Healthcare & Hospital -->
      <div style="background: rgba(9,13,22,0.6); border: 1px solid var(--border-glass); border-radius: 12px; padding: 1.1rem">
        <h4 style="font-size: 0.85rem; color: var(--text-primary); margin-bottom: 0.75rem">🏥 Emergency Hospital Hub</h4>
        <div class="stat-row">
          <span class="stat-label">Hospital:</span>
          <span class="stat-val" style="color: var(--accent-rose); font-size: 0.75rem">${village.nearestHospitalHub}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Transit Saved:</span>
          <span class="stat-val" style="color: var(--accent-rose)">-${m.hospitalTimeSavedHrs} hrs</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">ICU & Care:</span>
          <span class="stat-val" style="font-size: 0.72rem">${village.primaryHealthcareServices}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Healthcare Value:</span>
          <span class="stat-val" style="color: var(--accent-rose)">₹${m.annualHealthcareValueLakhs}L / yr</span>
        </div>
      </div>
    </div>

    <!-- Public Transport & Bus Mobility Audit Card -->
    <div style="background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.25); border-radius: 14px; padding: 1.25rem; margin-bottom: 1.5rem">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem">
        <div style="font-size: 1rem; font-weight: 800; color: #fbbf24; display: flex; align-items: center; gap: 0.5rem">
          <span>🚌 Public Bus Transport & Passenger Mobility Audit</span>
        </div>
        <div style="font-size: 0.78rem; font-weight: 600; color: var(--accent-cyan); background: rgba(56,189,248,0.12); padding: 0.35rem 0.75rem; border-radius: 6px">
          ${village.ksrtcDivision || 'KSRTC Regional Transport'}
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.85rem; background: rgba(0,0,0,0.3); padding: 0.85rem; border-radius: 10px; font-size: 0.82rem; margin-bottom: 1rem">
        <div>
          <span style="color: var(--text-muted)">🚶 Bus Stop Walk:</span>
          <div style="font-family: var(--font-mono); font-weight: 700; color: #fb7185; margin-top: 0.15rem">${m.walkToBusStopKm} km walk to bus</div>
        </div>
        <div>
          <span style="color: var(--text-muted)">🚍 Current Bus Freq:</span>
          <div style="font-family: var(--font-mono); font-weight: 700; color: ${m.currentBusFreq === 0 ? '#ef4444' : '#fbbf24'}; margin-top: 0.15rem">
            ${m.currentBusFreq === 0 ? '🔴 0 Buses (Unserviceable)' : `${m.currentBusFreq} buses/day`}
          </div>
        </div>
        <div>
          <span style="color: var(--text-muted)">🚀 Projected KSRTC Buses:</span>
          <div style="font-family: var(--font-mono); font-weight: 700; color: var(--accent-emerald); margin-top: 0.15rem">
            🚌 +${m.busFreqGain} trips/day (${m.projBusFreq} total)
          </div>
        </div>
        <div>
          <span style="color: var(--text-muted)">🎫 Annual Pass Riders:</span>
          <div style="font-family: var(--font-mono); font-weight: 700; color: var(--accent-cyan); margin-top: 0.15rem">
            ${m.annualBusPassengers.toLocaleString()} passengers/yr
          </div>
        </div>
      </div>

      <!-- 🏛️ Government Action Plan & Strategy for KSRTC Expansion -->
      <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 12px; padding: 1rem; font-size: 0.82rem">
        <div style="font-size: 0.85rem; font-weight: 800; color: #fbbf24; margin-bottom: 0.65rem; display: flex; align-items: center; gap: 0.4rem">
          <span>🏛️ Actionable Government Interventions to Expand KSRTC Bus Access</span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem 1rem">
          <div style="display: flex; gap: 0.5rem; align-items: flex-start">
            <span style="font-size: 1.1rem">1️⃣</span>
            <div>
              <strong style="color: #fff">PWD / RDPR Road Paving Standard:</strong>
              <div style="color: #94a3b8; font-size: 0.76rem; margin-top: 0.1rem">
                Pave ${village.roadLengthKm}km unpaved track to All-Weather Bituminous/CC standard (3.75m width + 1.0m shoulder) to support heavy 42-seater KSRTC axle loads.
              </div>
            </div>
          </div>

          <div style="display: flex; gap: 0.5rem; align-items: flex-start">
            <span style="font-size: 1.1rem">2️⃣</span>
            <div>
              <strong style="color: #fff">Targeted Fleet Deployment:</strong>
              <div style="color: #94a3b8; font-size: 0.76rem; margin-top: 0.1rem">
                ${village.terrain === 'Hilly / Mountainous' ? 'Induct KSRTC 28-seater Midi-Buses tailored for tight Malnad mountain curves.' : 'Induct KSRTC 42-seater Gramina Sarige buses with reinforced agri-produce luggage racks.'}
              </div>
            </div>
          </div>

          <div style="display: flex; gap: 0.5rem; align-items: flex-start">
            <span style="font-size: 1.1rem">3️⃣</span>
            <div>
              <strong style="color: #fff">State Viability Gap Funding (VGF):</strong>
              <div style="color: #94a3b8; font-size: 0.76rem; margin-top: 0.1rem">
                Allocate ~₹${(village.roadLengthKm * 1.2).toFixed(1)}L/yr VGF operational subsidy to KSRTC ${village.district} Division to offset initial low-density route gestation losses.
              </div>
            </div>
          </div>

          <div style="display: flex; gap: 0.5rem; align-items: flex-start">
            <span style="font-size: 1.1rem">4️⃣</span>
            <div>
              <strong style="color: #fff">Shakti Yojna Timetable Alignment:</strong>
              <div style="color: #94a3b8; font-size: 0.76rem; margin-top: 0.1rem">
                Align morning 6:30 AM & evening 4:30 PM departure timings with local high school/college bells and APMC trading hours for maximum Shakti Yojna pass usage.
              </div>
            </div>
          </div>

          <div style="display: flex; gap: 0.5rem; align-items: flex-start">
            <span style="font-size: 1.1rem">5️⃣</span>
            <div>
              <strong style="color: #fff">Gram Panchayat Solar Bus Stop:</strong>
              <div style="color: #94a3b8; font-size: 0.76rem; margin-top: 0.1rem">
                Construct a solar-lighted Panchayat Bus Shelter & EV mini-bus charging stop at the village entry feeder junction.
              </div>
            </div>
          </div>

          <div style="display: flex; gap: 0.5rem; align-items: flex-start">
            <span style="font-size: 1.1rem">6️⃣</span>
            <div>
              <strong style="color: #fff">14-Day Joint Inspection Protocol:</strong>
              <div style="color: #94a3b8; font-size: 0.76rem; margin-top: 0.1rem">
                Mandate joint route trial runs between PWD Executive Engineers and KSRTC Divisional Controllers within 14 days of road completion.
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Infrastructure & Isolation Summary -->
    <div style="background: rgba(9,13,22,0.6); border: 1px solid var(--border-glass); border-radius: 12px; padding: 1rem; margin-bottom: 1.5rem; display: flex; justify-content: space-around; font-size: 0.85rem">
      <div>👥 <strong>Population Served:</strong> ${village.population.toLocaleString()}</div>
      <div>🏥 <strong>Sub-Center:</strong> ${village.hasHealthCenter ? '✅ Present' : '❌ Isolated (High Need)'}</div>
      <div>🏫 <strong>Secondary School:</strong> ${village.hasSecondarySchool ? '✅ Present' : '❌ Isolated (High Need)'}</div>
    </div>

    <!-- Export Action -->
    <div style="display: flex; justify-content: flex-end; gap: 1rem">
      <button id="btnExportCSV" class="btn-inspect" style="padding: 0.6rem 1.25rem; font-size: 0.88rem">
        📥 Export Village Report (CSV)
      </button>
    </div>
  `;

  modalOverlay.classList.add('open');

  const btnExport = document.getElementById('btnExportCSV');
  if (btnExport) {
    btnExport.onclick = () => exportVillageCSV(village);
  }
}

export function setupModalControls() {
  const modalOverlay = document.getElementById('villageModalOverlay');
  const closeBtn = document.getElementById('modalCloseBtn');

  if (closeBtn) {
    closeBtn.onclick = () => modalOverlay.classList.remove('open');
  }

  if (modalOverlay) {
    modalOverlay.onclick = (e) => {
      if (e.target === modalOverlay) {
        modalOverlay.classList.remove('open');
      }
    };
  }
}

function exportVillageCSV(v) {
  const m = v.metrics;
  const headers = ["ID", "Name", "District", "State", "Population", "Road_Condition_Category", "Road_Condition", "Monsoon_Isolation_Days", "Cost_Lakhs", "MAI_Score", "ROI_Multiplier"];
  const row = [v.id, `"${v.name}"`, `"${v.district}"`, `"${v.state}"`, v.population, `"${v.roadConditionCategory}"`, `"${v.roadConditionLabel}"`, v.monsoonIsolationDays, v.estCostLakhs, m.maiScore, m.roiPerCrore];
  
  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), row.join(",")].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${v.name.replace(/\s+/g, '_')}_Road_ROI_Report.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

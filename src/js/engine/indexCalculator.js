/**
 * Economic Calculator Engine for Rural Road Connectivity
 * Computes Market Access Index (MAI), Urban Job & Education Commute Access,
 * Emergency Healthcare & Hospital Access, Total Annual Economic Benefit (₹ Lakhs),
 * and 10-Year ROI per ₹ Crore.
 */

export function calculateVillageMetrics(village) {
  // 1. Mandi Market Travel Time Saved
  const currentMandiHrs = village.currentTravelTimeMin / 60;
  const postMandiHrs = village.postRoadTravelTimeMin / 60;
  const timeSavedHrs = Math.max(0, currentMandiHrs - postMandiHrs);
  const timeSavedPercent = currentMandiHrs > 0 ? (timeSavedHrs / currentMandiHrs) * 100 : 0;

  // 2. Urban Employment & Education Travel Time Saved
  const currentUrbanHrs = (village.currentUrbanTravelTimeMin || village.currentTravelTimeMin * 1.2) / 60;
  const postUrbanHrs = (village.postUrbanTravelTimeMin || village.postRoadTravelTimeMin * 1.3) / 60;
  const urbanTimeSavedHrs = Math.max(0, currentUrbanHrs - postUrbanHrs);
  const urbanTimeSavedPercent = currentUrbanHrs > 0 ? (urbanTimeSavedHrs / currentUrbanHrs) * 100 : 0;

  // 3. Emergency Hospital & Healthcare Travel Time Saved
  const currentHospitalHrs = (village.currentHospitalTravelTimeMin || village.currentTravelTimeMin * 1.1) / 60;
  const postHospitalHrs = (village.postHospitalTravelTimeMin || village.postRoadTravelTimeMin * 1.15) / 60;
  const hospitalTimeSavedHrs = Math.max(0, currentHospitalHrs - postHospitalHrs);
  const hospitalTimeSavedPercent = currentHospitalHrs > 0 ? (hospitalTimeSavedHrs / currentHospitalHrs) * 100 : 0;

  // 4. Public Transport & Bus Connectivity Gains
  const walkToBusStopKm = village.walkToBusStopKm || village.roadLengthKm;
  const currentBusFreq = village.currentBusFrequencyPerDay || 0;
  const projBusFreq = village.projectedBusFrequencyPerDay || 6;
  const busFreqGain = Math.max(0, projBusFreq - currentBusFreq);
  
  // Public Transport Pass Beneficiaries (Students, Elderly, Women with Shakti Bus Pass)
  const annualBusPassengers = Math.round(village.population * 0.45 * Math.max(1, projBusFreq));
  const annualWalkTimeSavedHrs = Math.round((village.population * 0.35) * (walkToBusStopKm / 3.5) * 250 / 60);

  // 5. Agricultural Spoilage Prevention Benefit (Annual ₹ Lakhs)
  const totalAgriValueLakhs = (village.annualAgriYieldTons * village.avgAgriValuePerTon) / 100000;
  const perishableValueLakhs = totalAgriValueLakhs * (village.perishablePercent / 100);
  const spoilageEfficiencyGain = Math.min(0.9, (timeSavedHrs / Math.max(1, currentMandiHrs)) * 0.85);
  const annualAgriSavedLakhs = perishableValueLakhs * spoilageEfficiencyGain;

  // 6. Urban Job Commute & Higher Education Access Value (Annual ₹ Lakhs)
  const workingAgeYouth = village.population * 0.22;
  const annualUrbanJobCommuteLakhs = (workingAgeYouth * urbanTimeSavedHrs * 0.35);

  // 7. Lifesaving Emergency Healthcare & Hospital Access Value (Annual ₹ Lakhs)
  const healthIsolationWeight = village.hasHealthCenter ? 0.35 : 0.75;
  const annualHealthcareValueLakhs = (village.population * healthIsolationWeight * hospitalTimeSavedHrs * 0.42);

  // 8. Public Transport & Passenger Mobility Value (Annual ₹ Lakhs)
  const publicTransportAnnualValueLakhs = (busFreqGain * village.population * 0.0015) + (annualWalkTimeSavedHrs * 0.0004);

  // 9. Social Access Index
  let isolationMultiplier = 1.0;
  if (!village.hasHealthCenter) isolationMultiplier += 0.35;
  if (!village.hasSecondarySchool) isolationMultiplier += 0.25;
  if (currentBusFreq === 0) isolationMultiplier += 0.30; // High isolation if zero KSRTC buses
  const socialValueAnnualLakhs = (village.population * isolationMultiplier * 0.0028) * (timeSavedHrs + 0.5);

  // 10. Total Annual Economic & Social Value Created (₹ Lakhs)
  const totalAnnualEconomicValueLakhs = annualAgriSavedLakhs + annualUrbanJobCommuteLakhs + annualHealthcareValueLakhs + publicTransportAnnualValueLakhs + socialValueAnnualLakhs;

  // 11. 10-Year Economic ROI per ₹ Crore spent
  const costCrores = village.estCostLakhs / 100;
  const tenYearBenefitLakhs = totalAnnualEconomicValueLakhs * 10;
  const roiPerCrore = costCrores > 0 ? (tenYearBenefitLakhs / village.estCostLakhs) : 0;

  // 12. Multi-Pillar Comprehensive Accessibility Score (CAS) Engine
  // Calculates pre-road baseline vs post-road projected accessibility (0 to 100)
  
  // Pillar 1: Urban Centre Access Sub-Score (20% Weight)
  const urbanAccessPre = Math.max(5, Math.min(100, 100 - ((village.currentUrbanTravelTimeMin || 180) / 240) * 85));
  const urbanAccessPost = Math.max(40, Math.min(100, 100 - ((village.postUrbanTravelTimeMin || 45) / 240) * 85));

  // Pillar 2: Road Condition & Seasonality Sub-Score (18% Weight)
  const roadBasePre = village.roadConditionCategory === 'SEVERELY_BAD' ? 12 : 35;
  const monsoonPenalty = Math.min(30, (village.monsoonIsolationDays / 100) * 30);
  const roadAccessPre = Math.max(5, roadBasePre - monsoonPenalty + (village.maxCurrentSpeedKmh * 0.5));
  const roadAccessPost = 95.0; // Paved all-weather bitumen, 0 monsoon cut-off

  // Pillar 3: Distance from Major Paved Road / Highway Sub-Score (15% Weight)
  const majorRoadDistPre = Math.max(5, Math.min(100, 100 - (village.roadLengthKm / 9.0) * 85));
  const majorRoadDistPost = 98.0; // Direct paved highway connection

  // Pillar 4: Healthcare & Hospital Access Sub-Score (16% Weight)
  const healthCenterBonus = village.hasHealthCenter ? 20 : 0;
  const healthAccessPre = Math.max(5, Math.min(100, (100 - ((village.currentHospitalTravelTimeMin || 160) / 240) * 75) + healthCenterBonus));
  const healthAccessPost = Math.max(50, Math.min(100, (100 - ((village.postHospitalTravelTimeMin || 35) / 240) * 75) + healthCenterBonus));

  // Pillar 5: Education Access Sub-Score (11% Weight)
  const schoolBonus = village.hasSecondarySchool ? 35 : 10;
  const eduAccessPre = Math.max(5, Math.min(100, schoolBonus + (100 - ((village.currentUrbanTravelTimeMin || 180) / 240) * 50)));
  const eduAccessPost = Math.max(50, Math.min(100, schoolBonus + (100 - ((village.postUrbanTravelTimeMin || 45) / 240) * 50)));

  // Pillar 6: Market Access Sub-Score (12% Weight)
  const marketAccessPre = Math.max(5, Math.min(100, 100 - (village.currentTravelTimeMin / 240) * 75 - (village.perishablePercent * 0.15)));
  const marketAccessPost = Math.max(50, Math.min(100, 100 - (village.postRoadTravelTimeMin / 240) * 75 - (village.perishablePercent * 0.05)));

  // Pillar 7: Public Transport & Bus Accessibility Sub-Score (8% Weight)
  const transitAccessPre = Math.max(0, Math.min(100, (currentBusFreq / 10) * 60 + (Math.max(0, 6 - walkToBusStopKm) / 6) * 40));
  const transitAccessPost = Math.max(40, Math.min(100, (projBusFreq / 10) * 60 + 40));

  // Composite Weighted Sum (Weights sum to 100%)
  const currentAccessibilityScore = parseFloat((
    (urbanAccessPre * 0.20) +
    (roadAccessPre * 0.18) +
    (majorRoadDistPre * 0.15) +
    (healthAccessPre * 0.16) +
    (eduAccessPre * 0.11) +
    (marketAccessPre * 0.12) +
    (transitAccessPre * 0.08)
  ).toFixed(1));

  const projectedAccessibilityScore = parseFloat((
    (urbanAccessPost * 0.20) +
    (roadAccessPost * 0.18) +
    (majorRoadDistPost * 0.15) +
    (healthAccessPost * 0.16) +
    (eduAccessPost * 0.11) +
    (marketAccessPost * 0.12) +
    (transitAccessPost * 0.08)
  ).toFixed(1));

  const accessibilityGain = parseFloat((projectedAccessibilityScore - currentAccessibilityScore).toFixed(1));

  // 13. Overall MAI & Connectivity Score
  const popScore = Math.min(100, (village.population / 6000) * 100) * 0.12;
  const timeScore = Math.min(100, (timeSavedPercent / 85) * 100) * 0.12;
  const urbanScore = Math.min(100, (urbanTimeSavedPercent / 80) * 100) * 0.12;
  const hospitalScore = Math.min(100, (hospitalTimeSavedPercent / 80) * 100) * 0.18;
  const publicTransportScore = Math.min(100, ((busFreqGain + (walkToBusStopKm * 1.5)) / 12) * 100) * 0.15;
  const roiScore = Math.min(100, (roiPerCrore / 4.0) * 100) * 0.21;
  const isolationScore = Math.min(100, (isolationMultiplier / 1.8) * 100) * 0.10;

  const maiScore = Math.min(99.9, Math.max(1.0, popScore + timeScore + urbanScore + hospitalScore + publicTransportScore + roiScore + isolationScore));

  return {
    timeSavedHrs: parseFloat(timeSavedHrs.toFixed(2)),
    timeSavedPercent: parseFloat(timeSavedPercent.toFixed(1)),
    urbanTimeSavedHrs: parseFloat(urbanTimeSavedHrs.toFixed(2)),
    urbanTimeSavedPercent: parseFloat(urbanTimeSavedPercent.toFixed(1)),
    hospitalTimeSavedHrs: parseFloat(hospitalTimeSavedHrs.toFixed(2)),
    hospitalTimeSavedPercent: parseFloat(hospitalTimeSavedPercent.toFixed(1)),
    walkToBusStopKm: parseFloat(walkToBusStopKm.toFixed(1)),
    currentBusFreq,
    projBusFreq,
    busFreqGain,
    annualBusPassengers,
    annualWalkTimeSavedHrs,
    annualAgriSavedLakhs: parseFloat(annualAgriSavedLakhs.toFixed(2)),
    annualUrbanJobCommuteLakhs: parseFloat(annualUrbanJobCommuteLakhs.toFixed(2)),
    annualHealthcareValueLakhs: parseFloat(annualHealthcareValueLakhs.toFixed(2)),
    publicTransportAnnualValueLakhs: parseFloat(publicTransportAnnualValueLakhs.toFixed(2)),
    socialValueAnnualLakhs: parseFloat(socialValueAnnualLakhs.toFixed(2)),
    totalAnnualEconomicValueLakhs: parseFloat(totalAnnualEconomicValueLakhs.toFixed(2)),
    costCrores: parseFloat(costCrores.toFixed(2)),
    tenYearBenefitLakhs: parseFloat(tenYearBenefitLakhs.toFixed(2)),
    roiPerCrore: parseFloat(roiPerCrore.toFixed(2)),
    maiScore: parseFloat(maiScore.toFixed(1)),
    // Accessibility Score Matrix
    accessibility: {
      current: currentAccessibilityScore,
      projected: projectedAccessibilityScore,
      gain: accessibilityGain,
      breakdown: {
        urban: { pre: parseFloat(urbanAccessPre.toFixed(1)), post: parseFloat(urbanAccessPost.toFixed(1)) },
        road: { pre: parseFloat(roadAccessPre.toFixed(1)), post: parseFloat(roadAccessPost.toFixed(1)) },
        majorRoad: { pre: parseFloat(majorRoadDistPre.toFixed(1)), post: parseFloat(majorRoadDistPost.toFixed(1)) },
        health: { pre: parseFloat(healthAccessPre.toFixed(1)), post: parseFloat(healthAccessPost.toFixed(1)) },
        edu: { pre: parseFloat(eduAccessPre.toFixed(1)), post: parseFloat(eduAccessPost.toFixed(1)) },
        market: { pre: parseFloat(marketAccessPre.toFixed(1)), post: parseFloat(marketAccessPost.toFixed(1)) },
        transit: { pre: parseFloat(transitAccessPre.toFixed(1)), post: parseFloat(transitAccessPost.toFixed(1)) }
      }
    }
  };
}

export function enrichVillagesData(villagesList) {
  return villagesList.map(village => {
    const metrics = calculateVillageMetrics(village);
    return {
      ...village,
      metrics
    };
  }).sort((a, b) => b.metrics.maiScore - a.metrics.maiScore);
}

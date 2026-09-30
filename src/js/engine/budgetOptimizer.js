/**
 * Budget Optimization Engine (0-1 Knapsack & Greedy Heuristic)
 * Finds optimal road connectivity projects under total budget limit to maximize economic ROI.
 */

export function optimizeBudgetAllocation(villages, budgetLakhs) {
  // Sort villages by ROI per Rupee spent (density ratio: annual economic value / cost)
  const items = [...villages].map(v => ({
    village: v,
    cost: v.estCostLakhs,
    benefit: v.metrics.tenYearBenefitLakhs,
    density: v.metrics.roiPerCrore
  })).sort((a, b) => b.density - a.density);

  let currentBudget = budgetLakhs;
  const selectedVillages = [];
  let totalCost = 0;
  let totalBenefit = 0;
  let totalPopulation = 0;
  let totalTimeSavedMin = 0;

  for (const item of items) {
    if (item.cost <= currentBudget) {
      selectedVillages.push(item.village);
      currentBudget -= item.cost;
      totalCost += item.cost;
      totalBenefit += item.benefit;
      totalPopulation += item.village.population;
      totalTimeSavedMin += (item.village.currentTravelTimeMin - item.village.postRoadTravelTimeMin);
    }
  }

  // Calculate Naive Strategy (allocate budget by simple Population size)
  const naiveItems = [...villages].sort((a, b) => b.population - a.population);
  let naiveBudget = budgetLakhs;
  let naiveBenefit = 0;
  let naivePopulation = 0;
  
  for (const v of naiveItems) {
    if (v.estCostLakhs <= naiveBudget) {
      naiveBudget -= v.estCostLakhs;
      naiveBenefit += v.metrics.tenYearBenefitLakhs;
      naivePopulation += v.population;
    }
  }

  const benefitImprovementPct = naiveBenefit > 0 
    ? (((totalBenefit - naiveBenefit) / naiveBenefit) * 100).toFixed(1)
    : 0;

  return {
    selectedVillages,
    totalCostLakhs: parseFloat(totalCost.toFixed(2)),
    remainingBudgetLakhs: parseFloat((budgetLakhs - totalCost).toFixed(2)),
    totalBenefitLakhs: parseFloat(totalBenefit.toFixed(2)),
    totalPopulation,
    avgTimeSavedMin: selectedVillages.length > 0 ? Math.round(totalTimeSavedMin / selectedVillages.length) : 0,
    naiveBenefitLakhs: parseFloat(naiveBenefit.toFixed(2)),
    naivePopulation,
    benefitImprovementPct: parseFloat(benefitImprovementPct)
  };
}

import type { ConfigurationContextValue } from "../root/ConfigurationContext";
import type { Deal } from "../types";

export type DealsByStage = Record<Deal["stage"], Deal[]>;

export const getDealsByStage = (
  unorderedDeals: Deal[],
  dealStages: ConfigurationContextValue["dealStages"],
) => {
  if (!dealStages?.length || !Array.isArray(unorderedDeals)) return {};

  const dealsByStage: Record<Deal["stage"], Deal[]> = dealStages.reduce(
    (obj, stage) => ({ ...obj, [stage.value]: [] }),
    {} as Record<Deal["stage"], Deal[]>,
  );

  unorderedDeals.forEach((deal) => {
    const stage = dealStages.some((s) => s.value === deal.stage)
      ? deal.stage
      : dealStages[0].value;
    dealsByStage[stage] ??= [];
    dealsByStage[stage].push(deal);
  });

  // order each column by index
  dealStages.forEach((stage) => {
    dealsByStage[stage.value] = dealsByStage[stage.value].sort(
      (recordA: Deal, recordB: Deal) => recordA.index - recordB.index,
    );
  });
  return dealsByStage;
};

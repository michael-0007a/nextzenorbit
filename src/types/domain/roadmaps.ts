import type { RoadmapRow, RoadmapStepRow } from "@/types/database";

export type Roadmap = RoadmapRow;
export type RoadmapStep = RoadmapStepRow;

export type RoadmapWithSteps = {
  roadmap: RoadmapRow;
  steps: RoadmapStepRow[];
};

import type { CareerRow } from "@/types/database";

export type Career = CareerRow;

export type CareerSummary = Pick<
  CareerRow,
  "id" | "title" | "slug" | "description" | "icon"
>;

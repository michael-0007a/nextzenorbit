import {
  BarChart3,
  Brain,
  Briefcase,
  CloudCog,
  Layers,
  Layout,
  Server,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  layout: Layout,
  server: Server,
  layers: Layers,
  "cloud-cog": CloudCog,
  "bar-chart-3": BarChart3,
  brain: Brain,
};

export function getCareerIcon(icon?: string): LucideIcon {
  if (!icon) {
    return Briefcase;
  }

  return iconMap[icon] ?? Briefcase;
}

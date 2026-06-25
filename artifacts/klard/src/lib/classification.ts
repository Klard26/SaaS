import { useMemo } from "react";
import {
  useGetClassification,
  useListCategories,
  type Category,
  type World,
  type Area,
} from "@workspace/api-client-react";
import {
  Briefcase, Calculator, Zap, Scale, TrendingUp, Home as HomeIcon, Monitor,
  Megaphone, Users, Shield, Building, Target, FileSignature, ClipboardCheck,
  Compass, Rocket, Coins, Search, Newspaper, Laptop, Lock, ShieldCheck,
  UserCheck, Sparkles, Handshake, Brain, Apple, HeartPulse, Leaf, Ruler,
  SearchCheck, Scroll, Truck, GitMerge, Lightbulb, Receipt,
  PenTool, HardHat, Map as MapIcon, Thermometer, Wrench, Scissors,
  PawPrint, Baby, Camera, HeartHandshake,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/** Lucide icon registry keyed by the icon name stored on a category. */
export const ICONS: Record<string, LucideIcon> = {
  calculator: Calculator, zap: Zap, briefcase: Briefcase, scale: Scale,
  "trending-up": TrendingUp, home: HomeIcon, monitor: Monitor, megaphone: Megaphone,
  users: Users, shield: Shield, building: Building, target: Target,
  "file-signature": FileSignature, "clipboard-check": ClipboardCheck,
  compass: Compass, rocket: Rocket, coins: Coins, search: Search,
  newspaper: Newspaper, laptop: Laptop, lock: Lock, "shield-check": ShieldCheck,
  "user-check": UserCheck, sparkles: Sparkles, handshake: Handshake, brain: Brain,
  apple: Apple, "heart-pulse": HeartPulse, leaf: Leaf, ruler: Ruler,
  "search-check": SearchCheck, scroll: Scroll, truck: Truck, "git-merge": GitMerge,
  lightbulb: Lightbulb, receipt: Receipt,
  "pen-tool": PenTool, "hard-hat": HardHat, map: MapIcon, thermometer: Thermometer,
  wrench: Wrench, scissors: Scissors, "paw-print": PawPrint, baby: Baby,
  camera: Camera, "heart-handshake": HeartHandshake,
};

/** Per-area presentation icon (the API does not store icons on areas). */
export const AREA_ICON: Record<string, string> = {
  pro_bau: "hard-hat",
  pro_fin: "scale",
  pro_psy: "brain",
  pro_imm: "building",
  pro_biz: "trending-up",
  alltag_haus: "sparkles",
  alltag_garten: "leaf",
  alltag_hw: "wrench",
  alltag_mode: "scissors",
  alltag_beauty: "heart-pulse",
  alltag_tier: "paw-print",
  alltag_fam: "baby",
  alltag_evt: "camera",
  alltag_sen: "heart-handshake",
};

export function iconFor(name?: string | null): LucideIcon {
  return (name && ICONS[name]) || Briefcase;
}

export function areaIconFor(areaId?: string | null): LucideIcon {
  return iconFor(areaId ? AREA_ICON[areaId] : undefined);
}

export interface AreaGroup {
  area: Area;
  categories: Category[];
}
export interface WorldGroup {
  world: World;
  areas: AreaGroup[];
}

/**
 * Combines the flat category list with the world/area classification and
 * returns it grouped: worlds (ordered) -> areas (ordered) -> categories
 * (ordered by displayOrder). Areas/worlds with no categories are omitted.
 */
export function useClassifiedCategories() {
  const { data: categories = [], isLoading: loadingCats } = useListCategories();
  const { data: classification, isLoading: loadingClass } = useGetClassification();

  const worlds = classification?.worlds ?? [];
  const areas = classification?.areas ?? [];

  const grouped = useMemo<WorldGroup[]>(() => {
    const catsByArea = new Map<string, Category[]>();
    for (const c of categories) {
      if (!c.areaId) continue;
      const arr = catsByArea.get(c.areaId) ?? [];
      arr.push(c);
      catsByArea.set(c.areaId, arr);
    }
    for (const arr of catsByArea.values()) {
      arr.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    }

    const areasByWorld = new Map<string, Area[]>();
    for (const a of areas) {
      const arr = areasByWorld.get(a.worldId) ?? [];
      arr.push(a);
      areasByWorld.set(a.worldId, arr);
    }
    for (const arr of areasByWorld.values()) {
      arr.sort((a, b) => a.displayOrder - b.displayOrder);
    }

    return [...worlds]
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map<WorldGroup>((world) => ({
        world,
        areas: (areasByWorld.get(world.id) ?? [])
          .map<AreaGroup>((area) => ({ area, categories: catsByArea.get(area.id) ?? [] }))
          .filter((ag) => ag.categories.length > 0),
      }))
      .filter((wg) => wg.areas.length > 0);
  }, [categories, worlds, areas]);

  return { categories, worlds, areas, grouped, isLoading: loadingCats || loadingClass };
}

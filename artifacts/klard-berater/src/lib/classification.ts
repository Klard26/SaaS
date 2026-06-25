import { useMemo } from "react";
import {
  useGetClassification,
  useListCategories,
  type Category,
  type World,
  type Area,
} from "@workspace/api-client-react";

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

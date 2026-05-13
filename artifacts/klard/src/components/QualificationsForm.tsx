import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Info } from "lucide-react";

export type QualificationsValue = Record<string, unknown>;

interface CategoryQualifications {
  notes?: string;
  dena_required?: boolean;
  dena_categories?: string[];
  dena_programs?: string[];
  kammer_required?: boolean;
  kammer_type?: string;
  bauvorlage_required?: boolean;
  oebvi_optional?: boolean;
  zertifizierung_required?: boolean;
  options?: string[];
  specialties?: string[];
  fachbereiche?: string[];
}

const LABELS: Record<string, string> = {
  // dena_categories
  wg: "Wohngebäude (WG)",
  nwg: "Nichtwohngebäude (NWG)",
  ap: "Anlagen & Prozesse (EEW)",
  kfn: "Klimafreundlicher Neubau (KFN)",
  denkmal: "Baudenkmal (WTA)",
  // dena_programs
  "bafa-ebw": "BAFA EBW",
  "bafa-ebn": "BAFA EBN",
  "beg-wg": "BEG WG",
  "beg-nwg": "BEG NWG",
  "beg-em": "BEG EM",
  "kfw-kfn": "KfW KFN",
  "kfw-kfg": "KfW KFG",
  "dgnb-qng": "DGNB / QNG",
  // sac options
  "öbuv": "Öffentlich bestellt & vereidigt (ö.b.u.v.)",
  "din-iso-17024": "Zertifiziert nach DIN EN ISO/IEC 17024",
  // sac specialties
  bewertung: "Bewertung / Wertermittlung",
  schaeden: "Bauschäden",
  feuchte: "Feuchteschäden / Schimmel",
  schadstoff: "Schadstoffe",
  schall: "Schallschutz",
  brand: "Brandschutz",
  // tga fachbereiche
  heizung: "Heizung",
  lueftung: "Lüftung / Klima",
  sanitaer: "Sanitär",
  elektro: "Elektro",
  // bps specialties (commonly: bauphysik, schallschutz, brandschutz, schadstoffe)
  bauphysik: "Bauphysik",
  schallschutz: "Schallschutz",
  brandschutz: "Brandschutz",
  schadstoffe: "Schadstoffe",
};

const KAMMER_TYPE_LABEL: Record<string, string> = {
  architekt: "Architektenkammer",
  ingenieur: "Ingenieurkammer",
};

const labelOf = (k: string) => LABELS[k] ?? k;

export function QualificationsForm({
  config,
  value,
  onChange,
}: {
  config: CategoryQualifications | null | undefined;
  value: QualificationsValue;
  onChange: (next: QualificationsValue) => void;
}) {
  if (!config) return null;
  const set = (key: string, v: unknown) => onChange({ ...value, [key]: v });
  const toggleArr = (key: string, item: string) => {
    const cur = Array.isArray(value[key]) ? (value[key] as string[]) : [];
    const next = cur.includes(item) ? cur.filter((x) => x !== item) : [...cur, item];
    set(key, next);
  };
  const checked = (key: string, item: string) =>
    Array.isArray(value[key]) && (value[key] as string[]).includes(item);

  return (
    <div className="pt-4 border-t border-border">
      <h3 className="text-sm font-semibold text-foreground mb-1">Qualifikationen für diese Branche</h3>
      <p className="text-xs text-muted-foreground mb-4">
        Diese Angaben sind für eine seriöse Listung erforderlich und werden Mandanten auf Ihrem Profil angezeigt.
      </p>

      {config.notes && (
        <div className="flex gap-2 rounded-md bg-muted/60 px-3 py-2 mb-4 text-xs text-muted-foreground">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <p>{config.notes}</p>
        </div>
      )}

      {/* dena (Energieberatung) */}
      {config.dena_required && (
        <div className="space-y-3 mb-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">dena-Kundennummer *</Label>
              <Input
                placeholder="z.B. 123456"
                value={(value.dena_id as string) ?? ""}
                onChange={(e) => set("dena_id", e.target.value)}
                data-testid="input-qual-dena-id"
              />
            </div>
            <div>
              <Label className="text-xs">Gelistet seit (Jahr)</Label>
              <Input
                type="number"
                min={1990}
                max={new Date().getFullYear()}
                placeholder="z.B. 2018"
                value={(value.dena_since as string) ?? ""}
                onChange={(e) => set("dena_since", e.target.value)}
                data-testid="input-qual-dena-since"
              />
            </div>
          </div>

          {config.dena_categories && config.dena_categories.length > 0 && (
            <div>
              <Label className="text-xs mb-1.5 block">Eingetragene Kategorien</Label>
              <div className="grid sm:grid-cols-2 gap-1.5">
                {config.dena_categories.map((c) => (
                  <label key={c} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={checked("dena_categories", c)}
                      onCheckedChange={() => toggleArr("dena_categories", c)}
                    />
                    {labelOf(c)}
                  </label>
                ))}
              </div>
            </div>
          )}

          {config.dena_programs && config.dena_programs.length > 0 && (
            <div>
              <Label className="text-xs mb-1.5 block">Freigeschaltete Förderprogramme</Label>
              <div className="grid sm:grid-cols-2 gap-1.5">
                {config.dena_programs.map((p) => (
                  <label key={p} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={checked("dena_programs", p)}
                      onCheckedChange={() => toggleArr("dena_programs", p)}
                    />
                    {labelOf(p)}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Kammer (arc, sta, tga, bps) */}
      {config.kammer_required && (
        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          <div>
            <Label className="text-xs">
              {(config.kammer_type && KAMMER_TYPE_LABEL[config.kammer_type]) ?? "Kammer"} – Bundesland *
            </Label>
            <Input
              placeholder="z.B. Berlin"
              value={(value.kammer_state as string) ?? ""}
              onChange={(e) => set("kammer_state", e.target.value)}
              data-testid="input-qual-kammer-state"
            />
          </div>
          <div>
            <Label className="text-xs">Mitgliedsnummer *</Label>
            <Input
              placeholder="z.B. 12345"
              value={(value.kammer_id as string) ?? ""}
              onChange={(e) => set("kammer_id", e.target.value)}
              data-testid="input-qual-kammer-id"
            />
          </div>
        </div>
      )}

      {/* Bauvorlageberechtigung (arc) */}
      {config.bauvorlage_required && (
        <label className="flex items-center gap-2 text-sm mb-4">
          <Checkbox
            checked={value.bauvorlage === true}
            onCheckedChange={(v) => set("bauvorlage", v === true)}
            data-testid="checkbox-qual-bauvorlage"
          />
          Ich besitze die Bauvorlageberechtigung
        </label>
      )}

      {/* ÖbVI optional (vrm) */}
      {config.oebvi_optional && (
        <div className="space-y-3 mb-4">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={value.is_oebvi === true}
              onCheckedChange={(v) => set("is_oebvi", v === true)}
              data-testid="checkbox-qual-oebvi"
            />
            Ich bin öffentlich bestellter Vermessungsingenieur (ÖbVI)
          </label>
          {value.is_oebvi === true && (
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">ÖbVI – Bundesland</Label>
                <Input
                  placeholder="z.B. Bayern"
                  value={(value.oebvi_state as string) ?? ""}
                  onChange={(e) => set("oebvi_state", e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">Bestellungsnummer</Label>
                <Input
                  placeholder="z.B. 1234"
                  value={(value.oebvi_id as string) ?? ""}
                  onChange={(e) => set("oebvi_id", e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sachverständiger (sac) */}
      {config.zertifizierung_required && config.options && (
        <div className="mb-4">
          <Label className="text-xs mb-1.5 block">Anerkennung *</Label>
          <div className="space-y-1.5">
            {config.options.map((opt) => (
              <label key={opt} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={checked("zertifizierung", opt)}
                  onCheckedChange={() => toggleArr("zertifizierung", opt)}
                />
                {labelOf(opt)}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Spezialgebiete (sac, bps) */}
      {config.specialties && config.specialties.length > 0 && (
        <div className="mb-4">
          <Label className="text-xs mb-1.5 block">Spezialgebiete</Label>
          <div className="grid sm:grid-cols-2 gap-1.5">
            {config.specialties.map((s) => (
              <label key={s} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={checked("specialties", s)}
                  onCheckedChange={() => toggleArr("specialties", s)}
                />
                {labelOf(s)}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Fachbereiche (tga) */}
      {config.fachbereiche && config.fachbereiche.length > 0 && (
        <div className="mb-4">
          <Label className="text-xs mb-1.5 block">Fachbereiche TGA</Label>
          <div className="grid sm:grid-cols-2 gap-1.5">
            {config.fachbereiche.map((f) => (
              <label key={f} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={checked("fachbereiche", f)}
                  onCheckedChange={() => toggleArr("fachbereiche", f)}
                />
                {labelOf(f)}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

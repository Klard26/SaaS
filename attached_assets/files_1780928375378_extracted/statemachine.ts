/**
 * =====================================================================
 *  WattWechsel — Statusmaschinen
 *  (1) Vollmacht-Lebenszyklus
 *  (2) Wechselvorgang-Orchestrierung
 *
 *  Zweck: Compliance-kritische Übergänge an EINER Stelle definieren,
 *  damit kein Wechsel ohne gültige Vollmacht + korrekten Modus läuft.
 *  Jeder Übergang erzeugt einen Audit-Log-Eintrag.
 * =====================================================================
 */

// ----------------------- Typen -----------------------
export type VollmachtStatus =
  | 'entwurf' | 'aktiv' | 'pausiert' | 'widerrufen' | 'abgelaufen';

export type VollmachtModus =
  | 'nur_vorschlag'           // nur Empfehlung, kein Wechsel
  | 'freigabe_erforderlich'   // Wechsel nach aktiver Zustimmung
  | 'vollautomatisch';        // Wechsel nach Ablauf Widerspruchsfrist

export type WechselStatus =
  | 'analyse' | 'empfehlung' | 'wartet_freigabe' | 'freigegeben'
  | 'kuendigung_alt' | 'anmeldung_neu' | 'aktiv'
  | 'abgelehnt' | 'fehlgeschlagen' | 'widersprochen';

// ----------------------- (1) Vollmacht -----------------------
// Erlaubte Übergänge. Widerruf ist aus JEDEM aktiven Status möglich
// (gesetzlich jederzeit widerrufbar, unabhängig von Laufzeit).
const VOLLMACHT_UEBERGAENGE: Record<VollmachtStatus, VollmachtStatus[]> = {
  entwurf:    ['aktiv', 'widerrufen'],
  aktiv:      ['pausiert', 'widerrufen', 'abgelaufen'],
  pausiert:   ['aktiv', 'widerrufen', 'abgelaufen'],
  widerrufen: [],   // terminal
  abgelaufen: [],   // terminal
};

export function vollmachtUebergangErlaubt(
  von: VollmachtStatus, nach: VollmachtStatus,
): boolean {
  return VOLLMACHT_UEBERGAENGE[von]?.includes(nach) ?? false;
}

/** Darf unter dieser Vollmacht überhaupt gewechselt werden? */
export function darfWechseln(v: {
  status: VollmachtStatus;
  modus: VollmachtModus;
  darf_kuendigen: boolean;
  darf_abschliessen: boolean;
  gueltig_ab?: Date | null;
  gueltig_bis?: Date | null;
}): { erlaubt: boolean; grund?: string } {
  if (v.status !== 'aktiv')         return { erlaubt: false, grund: 'Vollmacht nicht aktiv' };
  if (v.modus === 'nur_vorschlag')  return { erlaubt: false, grund: 'Modus erlaubt nur Vorschläge' };
  if (!v.darf_kuendigen || !v.darf_abschliessen)
    return { erlaubt: false, grund: 'Umfang deckt Kündigung/Abschluss nicht ab' };
  const heute = new Date();
  if (v.gueltig_ab  && heute < v.gueltig_ab)  return { erlaubt: false, grund: 'Vollmacht noch nicht gültig' };
  if (v.gueltig_bis && heute > v.gueltig_bis) return { erlaubt: false, grund: 'Vollmacht abgelaufen' };
  return { erlaubt: true };
}

// ----------------------- (2) Wechselvorgang -----------------------
const WECHSEL_UEBERGAENGE: Record<WechselStatus, WechselStatus[]> = {
  analyse:        ['empfehlung', 'fehlgeschlagen'],
  empfehlung:     ['wartet_freigabe', 'freigegeben'], // freigegeben direkt nur bei vollautomatisch
  wartet_freigabe:['freigegeben', 'abgelehnt', 'widersprochen'],
  freigegeben:    ['kuendigung_alt', 'fehlgeschlagen'],
  kuendigung_alt: ['anmeldung_neu', 'fehlgeschlagen'],
  anmeldung_neu:  ['aktiv', 'fehlgeschlagen'],
  aktiv:          [],            // terminal (Erfolg)
  abgelehnt:      [],            // terminal
  fehlgeschlagen: ['analyse'],   // Wiederaufnahme möglich
  widersprochen:  [],            // terminal
};

export function wechselUebergangErlaubt(
  von: WechselStatus, nach: WechselStatus,
): boolean {
  return WECHSEL_UEBERGAENGE[von]?.includes(nach) ?? false;
}

/**
 * Kern-Orchestrierung: berechnet den nächsten Schritt nach der
 * Empfehlung — abhängig vom Vollmacht-Modus.
 *
 *  - nur_vorschlag        → bleibt bei 'empfehlung' (Mensch handelt extern)
 *  - freigabe_erforderlich→ 'wartet_freigabe' (aktive Zustimmung nötig)
 *  - vollautomatisch      → 'wartet_freigabe' MIT Widerspruchsfenster;
 *                           nach Ablauf ohne Widerspruch → 'freigegeben'
 *
 *  Bewusst KEIN sofortiger Wechsel ohne Fenster: rechtlich sauber,
 *  Widerspruchsrecht bleibt gewahrt.
 */
export function nachEmpfehlung(
  modus: VollmachtModus,
  widerspruchsfristTage: number,
): { naechsterStatus: WechselStatus; widerspruchBis?: Date } {
  switch (modus) {
    case 'nur_vorschlag':
      return { naechsterStatus: 'empfehlung' };
    case 'freigabe_erforderlich':
      return { naechsterStatus: 'wartet_freigabe' };
    case 'vollautomatisch': {
      const bis = new Date();
      bis.setDate(bis.getDate() + widerspruchsfristTage);
      return { naechsterStatus: 'wartet_freigabe', widerspruchBis: bis };
    }
  }
}

/** Cron/Worker: vollautomatische Vorgänge nach Fristablauf freigeben. */
export function autoFreigabeFaellig(vorgang: {
  status: WechselStatus;
  widerspruch_bis?: Date | null;
}): boolean {
  return (
    vorgang.status === 'wartet_freigabe' &&
    !!vorgang.widerspruch_bis &&
    new Date() >= vorgang.widerspruch_bis
  );
}

// ----------------------- Audit-Helfer -----------------------
export interface AuditEintrag {
  verwalter_id: string;
  vollmacht_id?: string;
  wechsel_id?: string;
  akteur: 'system' | 'ki' | string;  // bei Mensch: E-Mail
  aktion: string;
  details?: Record<string, unknown>;
}

/** Beispielhafte Persistenz-Signatur — Implementierung an DB-Layer. */
export type AuditWriter = (e: AuditEintrag) => Promise<void>;

-- ═══════════════════════════════════════════════════════════════
-- Klard Classification v3.0 — PostgreSQL Migration & Seed
-- Generated: 2026-06-25 16:16
-- Target: Supabase / PostgreSQL / Replit DB
--
-- Erweitert das Schema aus klard-seed-v2.sql um:
--   • worlds      (2 Welten: pro, alltag)
--   • areas       (13 Bereiche)
--   • Erweiterung von branches: + world_id, area_id, pricing_model, profession_code
--   • 56 neue branches aus Welt 02 (Armut-Modell)
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- ── WORLDS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS worlds (
  id                     TEXT PRIMARY KEY,
  title                  TEXT NOT NULL,
  description            TEXT,
  default_pricing_model  TEXT NOT NULL CHECK (default_pricing_model IN ('now','lead','hybrid')),
  display_order          INT,
  created_at             TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO worlds (id, title, description, default_pricing_model, display_order) VALUES
  ('pro', 'Beratung & Bauwesen', 'Professionelle Dienstleistungen mit Kammer-Pflicht, HOAI-Honorierung oder dena-Listung. Premium-Preise, terminbasierte Buchung, geringere Frequenz.', 'now', 1),
  ('alltag', 'Alltag & Handwerk', 'Lokale Dienstleistungen für Privatkunden und Kleinbetriebe nach dem Armut-Modell aus der Türkei. Anbieter zahlen pro qualifizierter Anfrage, kein Provisionsmodell.', 'lead', 2) ON CONFLICT (id) DO NOTHING;

-- ── AREAS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS areas (
  id              TEXT PRIMARY KEY,            -- z.B. 'pro_bau'
  world_id        TEXT NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  code            TEXT NOT NULL,               -- z.B. 'bau'
  num             TEXT NOT NULL,               -- z.B. '01'
  name            TEXT NOT NULL,
  description     TEXT,
  display_order   INT,
  UNIQUE (world_id, code)
);
CREATE INDEX IF NOT EXISTS idx_areas_world ON areas(world_id);

INSERT INTO areas (id, world_id, code, num, name, description, display_order) VALUES
  ('pro_bau', 'pro', 'bau', '01', 'Bau- & Energieberatung', 'Die 8 Berufsgruppen aus dem Leistungskatalog v2 — alle mit dena-Listung, HOAI oder Kammer-Pflicht.', 1),
  ('pro_fin', 'pro', 'fin', '02', 'Finanzen, Recht & Steuern', 'Reglementierte Beratungsberufe mit Standeskammern. Pflichtmitgliedschaft erforderlich, Standesgebühren teilweise vorgeschrieben.', 2),
  ('pro_psy', 'pro', 'psy', '03', 'Psychologie, Therapie & MPU', 'Reglementierte Heilberufe (Approbation, Heilpraktiker-Erlaubnis) und beratende Berufe. Hohe Vertrauensschwelle, oft Krisensituationen. MPU/Verkehrspsychologie als eigener stark nachgefragter Bereich mit BfArM-zertifizierter Begutachtung.', 3),
  ('pro_imm', 'pro', 'imm', '04', 'Immobilien', 'Vermittlung, Verwaltung und Bewertung. Teilweise §34c GewO-pflichtig, je nach Geschäftsfeld.', 4),
  ('pro_biz', 'pro', 'biz', '05', 'Unternehmen & Strategie', 'B2B-Beratung ohne Kammerpflicht. Schwerpunkt: Skalierung, Digitalisierung, Personalisierung.', 5),
  ('alltag_haus', 'alltag', 'haus', '01', 'Haushalt & Reinigung', 'Wiederkehrende Dienstleistungen für Privathaushalte. §35a EStG-fähig.', 6),
  ('alltag_garten', 'alltag', 'garten', '02', 'Garten & Außenanlagen', 'Saisonale Dienstleistungen rund ums Haus. §35a EStG-fähig.', 7),
  ('alltag_hw', 'alltag', 'hw', '03', 'Handwerk (Reparatur & Kleinarbeiten)', 'Klassische Handwerksleistungen für Privatkunden. Eintragung in Handwerksrolle teilweise erforderlich.', 8),
  ('alltag_mode', 'alltag', 'mode', '04', 'Mode, Schneiderei & Reparatur', 'Kleinbetriebe für Änderungen, Maßanfertigungen und Reparaturen.', 9),
  ('alltag_beauty', 'alltag', 'beauty', '05', 'Beauty, Wellness & Gesundheit', 'Mobile Dienstleistungen und stationäre Angebote. Gewerbe-Erlaubnis und teilweise Sachkundenachweis nötig.', 10),
  ('alltag_tier', 'alltag', 'tier', '06', 'Tier & Betreuung', 'Wachsender Markt mit hoher emotionaler Bindung. Pay-per-Lead besonders effektiv.', 11),
  ('alltag_fam', 'alltag', 'fam', '07', 'Kinder & Familie', 'Hochsensibler Bereich mit Schutzbedarf — erweitertes Führungszeugnis als Pflicht-Upload bei der Registrierung.', 12),
  ('alltag_evt', 'alltag', 'evt', '08', 'Foto, Event & Catering', 'Hochzeit, Feier, Firmenevent. Sehr hohe Customer-Lifetime-Value bei Erstkontakten.', 13),
  ('alltag_sen', 'alltag', 'sen', '09', 'Senioren & Alltagshilfe', 'Demografisch wachsender Markt. §45a SGB XI-Entlastungsbetrag (131 € / Monat) erstattbar.', 14) ON CONFLICT (id) DO NOTHING;

-- ── BRANCHES ERWEITERUNG ───────────────────────────────────
ALTER TABLE branches ADD COLUMN IF NOT EXISTS world_id        TEXT REFERENCES worlds(id);
ALTER TABLE branches ADD COLUMN IF NOT EXISTS area_id         TEXT REFERENCES areas(id);
ALTER TABLE branches ADD COLUMN IF NOT EXISTS profession_code TEXT;
ALTER TABLE branches ADD COLUMN IF NOT EXISTS pricing_model   TEXT CHECK (pricing_model IN ('now','lead','hybrid'));
ALTER TABLE branches ADD COLUMN IF NOT EXISTS indicative_price DECIMAL(10,2);
ALTER TABLE branches ADD COLUMN IF NOT EXISTS price_unit       TEXT;
ALTER TABLE branches ADD COLUMN IF NOT EXISTS example_services TEXT;
ALTER TABLE branches ADD COLUMN IF NOT EXISTS requirements     TEXT[];
CREATE INDEX IF NOT EXISTS idx_branches_world ON branches(world_id);
CREATE INDEX IF NOT EXISTS idx_branches_area  ON branches(area_id);

-- ── UPDATE: bestehende v2-Branchen → pro/bau zuordnen ─────
UPDATE branches SET world_id='pro', area_id='pro_bau', profession_code='ENB', pricing_model='now' WHERE id='enb';
UPDATE branches SET world_id='pro', area_id='pro_bau', profession_code='ARC', pricing_model='hybrid' WHERE id='arc';
UPDATE branches SET world_id='pro', area_id='pro_bau', profession_code='STA', pricing_model='lead' WHERE id='sta';
UPDATE branches SET world_id='pro', area_id='pro_bau', profession_code='BAU', pricing_model='lead' WHERE id='bau';
UPDATE branches SET world_id='pro', area_id='pro_bau', profession_code='SAC', pricing_model='now' WHERE id='sac';
UPDATE branches SET world_id='pro', area_id='pro_bau', profession_code='VRM', pricing_model='now' WHERE id='vrm';
UPDATE branches SET world_id='pro', area_id='pro_bau', profession_code='TGA', pricing_model='hybrid' WHERE id='tga';
UPDATE branches SET world_id='pro', area_id='pro_bau', profession_code='BPS', pricing_model='lead' WHERE id='bps';

-- ── NEUE BRANCHEN — Welt 01 (Bereiche 02–04) + Welt 02 (alle 9) ─
INSERT INTO branches (id, name, icon, description, color, color_light, world_id, area_id, profession_code, pricing_model, indicative_price, price_unit, example_services, requirements, display_order) VALUES
  ('pro_fin_stb', 'Steuerberatung', '📊', 'Steuererklärung, Bilanz, Beratung', '#185FA5', '#E6F1FB', 'pro', 'pro_fin', 'STB', 'now', 120, 'stunde', 'Steuererklärung, Bilanz, Beratung', ARRAY['StB-Kammer']::TEXT[], 101),
  ('pro_fin_rab', 'Rechtsberatung / Anwälte', '⚖️', 'Erstberatung, Vertretung, Vertrag', '#185FA5', '#E6F1FB', 'pro', 'pro_fin', 'RAB', 'hybrid', 240, 'stunde', 'Erstberatung, Vertretung, Vertrag', ARRAY['RAK']::TEXT[], 102),
  ('pro_fin_wpr', 'Wirtschaftsprüfung', '📋', 'Jahresabschluss, Prüfung, Due Diligence', '#185FA5', '#E6F1FB', 'pro', 'pro_fin', 'WPR', 'lead', 180, 'stunde', 'Jahresabschluss, Prüfung, Due Diligence', ARRAY['WPK']::TEXT[], 103),
  ('pro_fin_fin', 'Finanzberatung', '🏦', 'Geldanlage, Altersvorsorge, Bonität', '#185FA5', '#E6F1FB', 'pro', 'pro_fin', 'FIN', 'now', 150, 'stunde', 'Geldanlage, Altersvorsorge, Bonität', ARRAY['§34f GewO']::TEXT[], 104),
  ('pro_fin_vrs', 'Versicherungsberatung', '🛡️', 'Bedarfsanalyse, Honorarberatung', '#185FA5', '#E6F1FB', 'pro', 'pro_fin', 'VRS', 'now', 180, 'stunde', 'Bedarfsanalyse, Honorarberatung', ARRAY['§34d GewO']::TEXT[], 105),
  ('pro_fin_not', 'Notariat', '📜', 'Beurkundung, Erbrecht, Grundbuch', '#185FA5', '#E6F1FB', 'pro', 'pro_fin', 'NOT', 'now', NULL, 'gnotkg', 'Beurkundung, Erbrecht, Grundbuch', ARRAY['Notarkammer']::TEXT[], 106),
  ('pro_psy_pth', 'Psychotherapie (approbiert)', '🧠', 'Verhaltens-, tiefenpsychologisch fundierte, analytische, systemische Therapie · Kassenzulassung', '#6E3B5F', '#F3E8EF', 'pro', 'pro_psy', 'PTH', 'now', 110, 'stunde', 'Verhaltens-, tiefenpsychologisch fundierte, analytische, systemische Therapie · Kassenzulassung', ARRAY['Approbation']::TEXT[], 107),
  ('pro_psy_kjp', 'Kinder- & Jugendlichenpsychotherapie', '🧩', 'Approbierte KJP, oft mit Eltern-/Familiengesprächen', '#6E3B5F', '#F3E8EF', 'pro', 'pro_psy', 'KJP', 'now', 110, 'stunde', 'Approbierte KJP, oft mit Eltern-/Familiengesprächen', ARRAY['Approbation KJP']::TEXT[], 108),
  ('pro_psy_hpp', 'Heilpraktiker für Psychotherapie', '💭', 'Psychotherapie ohne Kassenabrechnung, oft niedrigschwellig', '#6E3B5F', '#F3E8EF', 'pro', 'pro_psy', 'HPP', 'hybrid', 90, 'stunde', 'Psychotherapie ohne Kassenabrechnung, oft niedrigschwellig', ARRAY['HPG-Erl.']::TEXT[], 109),
  ('pro_psy_psb', 'Psychologische Beratung', '🗣️', 'Lebensberatung, Krisenbewältigung, Selbstreflexion (ohne Heilkundeprivileg)', '#6E3B5F', '#F3E8EF', 'pro', 'pro_psy', 'PSB', 'lead', 80, 'stunde', 'Lebensberatung, Krisenbewältigung, Selbstreflexion (ohne Heilkundeprivileg)', ARRAY['Gewerbe']::TEXT[], 110),
  ('pro_psy_pft', 'Paar- & Familientherapie', '💞', 'Beziehungskonflikte, Trennung, Familiendynamik', '#6E3B5F', '#F3E8EF', 'pro', 'pro_psy', 'PFT', 'hybrid', 130, 'stunde', 'Beziehungskonflikte, Trennung, Familiendynamik', ARRAY['DGSF/SG']::TEXT[], 111),
  ('pro_psy_trg', 'Trauerbegleitung', '🕊️', 'Begleitung nach Verlust, Hospiz-anschluss möglich', '#6E3B5F', '#F3E8EF', 'pro', 'pro_psy', 'TRG', 'lead', 70, 'stunde', 'Begleitung nach Verlust, Hospiz-anschluss möglich', ARRAY['BVT']::TEXT[], 112),
  ('pro_psy_sub', 'Suchtberatung', '🧘', 'Alkohol, Drogen, Spiel, Co-Abhängige · Erst-/Wiederholungs-Beratung', '#6E3B5F', '#F3E8EF', 'pro', 'pro_psy', 'SUB', 'lead', 75, 'stunde', 'Alkohol, Drogen, Spiel, Co-Abhängige · Erst-/Wiederholungs-Beratung', ARRAY['Sozialpäd. + Sucht']::TEXT[], 113),
  ('pro_psy_mpu', 'MPU-Vorbereitung', '🚗', 'Verkehrspsychologische Beratung Alkohol/Drogen/Punkte, Gutachten-Vorbereitung', '#6E3B5F', '#F3E8EF', 'pro', 'pro_psy', 'MPU', 'lead', 180, 'stunde', 'Verkehrspsychologische Beratung Alkohol/Drogen/Punkte, Gutachten-Vorbereitung', ARRAY['Verkehrspsy.']::TEXT[], 114),
  ('pro_psy_vpb', 'Verkehrspsychologische Begutachtung', '📝', 'Eigentliche MPU-Untersuchung, BfArM-zertifizierte Begutachtungsstelle', '#6E3B5F', '#F3E8EF', 'pro', 'pro_psy', 'VPB', 'now', 750, 'objekt', 'Eigentliche MPU-Untersuchung, BfArM-zertifizierte Begutachtungsstelle', ARRAY['BfArM-Stelle']::TEXT[], 115),
  ('pro_psy_med', 'Mediation', '🤝', 'Wirtschafts-, Familien-, Erbschafts-Mediation, anerkannte Ausbildung', '#6E3B5F', '#F3E8EF', 'pro', 'pro_psy', 'MED', 'hybrid', 180, 'stunde', 'Wirtschafts-, Familien-, Erbschafts-Mediation, anerkannte Ausbildung', ARRAY['BMWA / BAFM']::TEXT[], 116),
  ('pro_imm_mak', 'Immobilienmakler', '🏠', 'Vermarktung, Verkauf, Vermietung', '#7C3AED', '#EDE9FE', 'pro', 'pro_imm', 'MAK', 'lead', NULL, 'provision', 'Vermarktung, Verkauf, Vermietung', ARRAY['§34c GewO']::TEXT[], 117),
  ('pro_imm_vwa', 'Hausverwaltung (WEG/SEV)', '🏢', 'WEG-Verwaltung, Mietverwaltung, Sondereig.', '#7C3AED', '#EDE9FE', 'pro', 'pro_imm', 'VWA', 'lead', 28, 'we_monat', 'WEG-Verwaltung, Mietverwaltung, Sondereig.', ARRAY['§34c GewO']::TEXT[], 118),
  ('pro_imm_imb', 'Immobilienbewertung', '🔍', 'Verkehrswert, Ertragswert, BelWertV', '#7C3AED', '#EDE9FE', 'pro', 'pro_imm', 'IMB', 'now', 1900, 'objekt', 'Verkehrswert, Ertragswert, BelWertV', ARRAY['Sachverst.']::TEXT[], 119),
  ('pro_biz_ube', 'Unternehmensberatung', '💼', 'Strategie, Restrukturierung, M&A', '#0E7490', '#CFFAFE', 'pro', 'pro_biz', 'UBE', 'lead', 180, 'stunde', 'Strategie, Restrukturierung, M&A', ARRAY[]::TEXT[], 120),
  ('pro_biz_mkt', 'Marketingberatung', '📢', 'SEO, Social, Brand, Performance', '#0E7490', '#CFFAFE', 'pro', 'pro_biz', 'MKT', 'lead', 120, 'stunde', 'SEO, Social, Brand, Performance', ARRAY[]::TEXT[], 121),
  ('pro_biz_itb', 'IT & Digitalisierung', '💻', 'ERP, Cloud, Cybersecurity, KI-Einsatz', '#0E7490', '#CFFAFE', 'pro', 'pro_biz', 'ITB', 'hybrid', 150, 'stunde', 'ERP, Cloud, Cybersecurity, KI-Einsatz', ARRAY[]::TEXT[], 122),
  ('pro_biz_per', 'Personalberatung', '👥', 'Recruiting, Executive Search, HR-Strategie', '#0E7490', '#CFFAFE', 'pro', 'pro_biz', 'PER', 'lead', NULL, 'jahresgehalt', 'Recruiting, Executive Search, HR-Strategie', ARRAY['AÜG bei Verleih']::TEXT[], 123),
  ('pro_biz_coa', 'Coaching', '🎓', 'Führung, Karriere, Business-Mentoring', '#0E7490', '#CFFAFE', 'pro', 'pro_biz', 'COA', 'now', 180, 'stunde', 'Führung, Karriere, Business-Mentoring', ARRAY[]::TEXT[], 124),
  ('alltag_haus_put', 'Putzkraft / Reinigungskraft', '🧹', 'Wohnungsreinigung, Büroreinigung, Treppenhaus', '#0891B2', '#E0F7FA', 'alltag', 'alltag_haus', 'PUT', 'lead', 18, 'stunde', 'Wohnungsreinigung, Büroreinigung, Treppenhaus', ARRAY['§35a']::TEXT[], 125),
  ('alltag_haus_frg', 'Fensterreinigung', '🪟', 'Fenster außen, Wintergarten, Glasfassaden', '#0891B2', '#E0F7FA', 'alltag', 'alltag_haus', 'FRG', 'lead', 4, 'qm', 'Fenster außen, Wintergarten, Glasfassaden', ARRAY[]::TEXT[], 126),
  ('alltag_haus_tep', 'Teppich- & Polsterreinigung', '🛋️', 'Sprühextraktion, Stuhl/Sofa, Matratze', '#0891B2', '#E0F7FA', 'alltag', 'alltag_haus', 'TEP', 'lead', 10, 'qm', 'Sprühextraktion, Stuhl/Sofa, Matratze', ARRAY[]::TEXT[], 127),
  ('alltag_haus_bue', 'Bügelservice', '👔', 'Hemden, Bettwäsche, Tischwäsche, Abhol-Service', '#0891B2', '#E0F7FA', 'alltag', 'alltag_haus', 'BUE', 'lead', 2.5, 'stueck', 'Hemden, Bettwäsche, Tischwäsche, Abhol-Service', ARRAY[]::TEXT[], 128),
  ('alltag_haus_wsc', 'Wäscheservice', '🧺', 'Wäsche waschen, trocknen, Lieferung', '#0891B2', '#E0F7FA', 'alltag', 'alltag_haus', 'WSC', 'lead', 8, 'kg', 'Wäsche waschen, trocknen, Lieferung', ARRAY[]::TEXT[], 129),
  ('alltag_haus_ent', 'Entrümpelung & Wohnungsauflösung', '📦', 'Haushaltsauflösung, Sperrmüll, Nachlass', '#0891B2', '#E0F7FA', 'alltag', 'alltag_haus', 'ENT', 'lead', NULL, 'pauschal', 'Haushaltsauflösung, Sperrmüll, Nachlass', ARRAY['§34h']::TEXT[], 130),
  ('alltag_haus_umz', 'Umzugshelfer & Möbeltransport', '🚚', 'Vollservice-Umzug, Klaviertransport, Lagerung', '#0891B2', '#E0F7FA', 'alltag', 'alltag_haus', 'UMZ', 'lead', 35, 'stunde', 'Vollservice-Umzug, Klaviertransport, Lagerung', ARRAY['Güterkraft. ab 3,5t']::TEXT[], 131),
  ('alltag_garten_gar', 'Gartenpflege', '🌱', 'Rasen mähen, Hecke schneiden, Unkraut', '#5F7142', '#E5EBD9', 'alltag', 'alltag_garten', 'GAR', 'lead', 28, 'stunde', 'Rasen mähen, Hecke schneiden, Unkraut', ARRAY[]::TEXT[], 132),
  ('alltag_garten_lan', 'Landschaftsbau & Gartengestaltung', '🌳', 'Planung, Bepflanzung, Wege, Teich', '#5F7142', '#E5EBD9', 'alltag', 'alltag_garten', 'LAN', 'lead', NULL, 'pauschal', 'Planung, Bepflanzung, Wege, Teich', ARRAY['Meister']::TEXT[], 133),
  ('alltag_garten_bpf', 'Baumpflege & Baumfällung', '🪓', 'Kronen-Schnitt, Fällung, Wurzelentfernung', '#5F7142', '#E5EBD9', 'alltag', 'alltag_garten', 'BPF', 'lead', NULL, 'pauschal', 'Kronen-Schnitt, Fällung, Wurzelentfernung', ARRAY['SKT-Schein']::TEXT[], 134),
  ('alltag_garten_ras', 'Rasen verlegen / Vertikutieren', '🌿', 'Rollrasen, Aussaat, Vertikutieren, Düngen', '#5F7142', '#E5EBD9', 'alltag', 'alltag_garten', 'RAS', 'lead', 12, 'qm', 'Rollrasen, Aussaat, Vertikutieren, Düngen', ARRAY[]::TEXT[], 135),
  ('alltag_garten_win', 'Winterdienst', '❄️', 'Schneeräumung, Streuen, Glättebekämpfung', '#5F7142', '#E5EBD9', 'alltag', 'alltag_garten', 'WIN', 'lead', 35, 'einsatz', 'Schneeräumung, Streuen, Glättebekämpfung', ARRAY['Verkehrssich.']::TEXT[], 136),
  ('alltag_garten_scb', 'Schädlingsbekämpfung', '🐭', 'Wespen, Marder, Mäuse, Tauben, Bettwanzen', '#5F7142', '#E5EBD9', 'alltag', 'alltag_garten', 'SCB', 'lead', NULL, 'pauschal', 'Wespen, Marder, Mäuse, Tauben, Bettwanzen', ARRAY['IHK-Sachk.']::TEXT[], 137),
  ('alltag_garten_poo', 'Pool- & Teichpflege', '🏊', 'Reinigung, Wasserwerte, Winterfest machen', '#5F7142', '#E5EBD9', 'alltag', 'alltag_garten', 'POO', 'lead', NULL, 'pauschal', 'Reinigung, Wasserwerte, Winterfest machen', ARRAY[]::TEXT[], 138),
  ('alltag_hw_mal', 'Maler & Lackierer', '🎨', 'Innenanstrich, Tapezieren, Fassade', '#993C1D', '#FAECE7', 'alltag', 'alltag_hw', 'MAL', 'lead', NULL, 'pauschal', 'Innenanstrich, Tapezieren, Fassade', ARRAY['HWO A']::TEXT[], 139),
  ('alltag_hw_mau', 'Maurer & Putzer', '🧱', 'Wanddurchbruch, Verputzen, Fliesenleger', '#993C1D', '#FAECE7', 'alltag', 'alltag_hw', 'MAU', 'lead', NULL, 'pauschal', 'Wanddurchbruch, Verputzen, Fliesenleger', ARRAY['HWO A']::TEXT[], 140),
  ('alltag_hw_elk', 'Elektriker', '⚡', 'Steckdose, Sicherung, E-Check, Lampen', '#993C1D', '#FAECE7', 'alltag', 'alltag_hw', 'ELK', 'lead', 85, 'stunde', 'Steckdose, Sicherung, E-Check, Lampen', ARRAY['HWO A']::TEXT[], 141),
  ('alltag_hw_san', 'Sanitär / Heizung', '🔧', 'Heizung warten, Wasserhahn, Toilette, Bad', '#993C1D', '#FAECE7', 'alltag', 'alltag_hw', 'SAN', 'lead', 85, 'stunde', 'Heizung warten, Wasserhahn, Toilette, Bad', ARRAY['HWO A']::TEXT[], 142),
  ('alltag_hw_tis', 'Tischler & Schreiner', '🪚', 'Möbel, Türen, Fenster, Einbauten', '#993C1D', '#FAECE7', 'alltag', 'alltag_hw', 'TIS', 'lead', NULL, 'pauschal', 'Möbel, Türen, Fenster, Einbauten', ARRAY['HWO A']::TEXT[], 143),
  ('alltag_hw_dac', 'Dachdecker', '🏘️', 'Reparatur, Neueindeckung, Dachfenster', '#993C1D', '#FAECE7', 'alltag', 'alltag_hw', 'DAC', 'lead', NULL, 'pauschal', 'Reparatur, Neueindeckung, Dachfenster', ARRAY['HWO A']::TEXT[], 144),
  ('alltag_hw_sld', 'Schlüsseldienst', '🗝️', 'Türöffnung, Schloss, Sicherheitstechnik', '#993C1D', '#FAECE7', 'alltag', 'alltag_hw', 'SLD', 'lead', NULL, 'pauschal', 'Türöffnung, Schloss, Sicherheitstechnik', ARRAY[]::TEXT[], 145),
  ('alltag_hw_glr', 'Glaser & Rolladen', '🪟', 'Glasbruch, Rolladen, Jalousien, Markisen', '#993C1D', '#FAECE7', 'alltag', 'alltag_hw', 'GLR', 'lead', NULL, 'pauschal', 'Glasbruch, Rolladen, Jalousien, Markisen', ARRAY['HWO A']::TEXT[], 146),
  ('alltag_hw_bod', 'Bodenleger', '📐', 'Parkett, Laminat, PVC, Teppich, Schleifen', '#993C1D', '#FAECE7', 'alltag', 'alltag_hw', 'BOD', 'lead', NULL, 'pauschal', 'Parkett, Laminat, PVC, Teppich, Schleifen', ARRAY['HWO B']::TEXT[], 147),
  ('alltag_mode_aen', 'Änderungsschneiderei', '✂️', 'Hose kürzen, Reißverschluss, Weiten/Engern', '#9F1239', '#FBEAF0', 'alltag', 'alltag_mode', 'AEN', 'lead', NULL, 'pauschal', 'Hose kürzen, Reißverschluss, Weiten/Engern', ARRAY[]::TEXT[], 148),
  ('alltag_mode_msc', 'Maßschneiderei', '🧵', 'Maßanzüge, Brautkleid, Kleider, Hemden', '#9F1239', '#FBEAF0', 'alltag', 'alltag_mode', 'MSC', 'lead', NULL, 'pauschal', 'Maßanzüge, Brautkleid, Kleider, Hemden', ARRAY['HWO B']::TEXT[], 149),
  ('alltag_mode_shm', 'Schuhmacher & Schuhreparatur', '👞', 'Absätze, Sohlen, Reißverschluss, Lederpflege', '#9F1239', '#FBEAF0', 'alltag', 'alltag_mode', 'SHM', 'lead', NULL, 'pauschal', 'Absätze, Sohlen, Reißverschluss, Lederpflege', ARRAY['HWO A']::TEXT[], 150),
  ('alltag_mode_pol', 'Polsterer', '🛋️', 'Sofa neu beziehen, Stuhl, Auto-Sitze', '#9F1239', '#FBEAF0', 'alltag', 'alltag_mode', 'POL', 'lead', NULL, 'pauschal', 'Sofa neu beziehen, Stuhl, Auto-Sitze', ARRAY['HWO B']::TEXT[], 151),
  ('alltag_mode_led', 'Lederreparatur', '👜', 'Jacke, Tasche, Auto-Innenraum, Reinigung', '#9F1239', '#FBEAF0', 'alltag', 'alltag_mode', 'LED', 'lead', NULL, 'pauschal', 'Jacke, Tasche, Auto-Innenraum, Reinigung', ARRAY[]::TEXT[], 152),
  ('alltag_beauty_frs', 'Friseur (mobil & Salon)', '💇', 'Schnitt, Färbung, Hochzeitsfrisur, Bart', '#BE185D', '#FDE8F0', 'alltag', 'alltag_beauty', 'FRS', 'lead', NULL, 'pauschal', 'Schnitt, Färbung, Hochzeitsfrisur, Bart', ARRAY['HWO A']::TEXT[], 153),
  ('alltag_beauty_kos', 'Kosmetik', '💄', 'Gesichtsbehandlung, Permanent-Make-up', '#BE185D', '#FDE8F0', 'alltag', 'alltag_beauty', 'KOS', 'lead', 65, 'stunde', 'Gesichtsbehandlung, Permanent-Make-up', ARRAY['Gewerbe']::TEXT[], 154),
  ('alltag_beauty_nag', 'Nagelstudio', '💅', 'Maniküre, Pediküre, Gel, Acryl', '#BE185D', '#FDE8F0', 'alltag', 'alltag_beauty', 'NAG', 'lead', NULL, 'pauschal', 'Maniküre, Pediküre, Gel, Acryl', ARRAY['Gewerbe']::TEXT[], 155),
  ('alltag_beauty_msg', 'Massage & Physiotherapie', '🤲', 'Wellness, medizinische Massage, Sport', '#BE185D', '#FDE8F0', 'alltag', 'alltag_beauty', 'MSG', 'lead', 65, 'stunde', 'Wellness, medizinische Massage, Sport', ARRAY['Heilpraktiker / PT']::TEXT[], 156),
  ('alltag_beauty_ost', 'Osteopathie', '🦴', 'Erstanamnese, Behandlung, Kinder-Osteo.', '#BE185D', '#FDE8F0', 'alltag', 'alltag_beauty', 'OST', 'now', 95, 'stunde', 'Erstanamnese, Behandlung, Kinder-Osteo.', ARRAY['Heilkundeberecht.']::TEXT[], 157),
  ('alltag_beauty_ern', 'Ernährungsberatung', '🥗', 'Abnehmen, Sportler, Allergien, Diabetiker', '#BE185D', '#FDE8F0', 'alltag', 'alltag_beauty', 'ERN', 'now', 80, 'stunde', 'Abnehmen, Sportler, Allergien, Diabetiker', ARRAY['Ökotrophologe']::TEXT[], 158),
  ('alltag_tier_tsi', 'Tiersitter / Hundesitter', '🐕', 'Stunden- oder Tagesbetreuung, Urlaub', '#A16207', '#FEF3C7', 'alltag', 'alltag_tier', 'TSI', 'lead', 20, 'tag', 'Stunden- oder Tagesbetreuung, Urlaub', ARRAY['Gewerbe']::TEXT[], 159),
  ('alltag_tier_gas', 'Gassi-Service', '🐾', 'Tägliches Gassi-Gehen, Mehrhunde-Service', '#A16207', '#FEF3C7', 'alltag', 'alltag_tier', 'GAS', 'lead', 15, 'stunde', 'Tägliches Gassi-Gehen, Mehrhunde-Service', ARRAY['Gewerbe']::TEXT[], 160),
  ('alltag_tier_hus', 'Hundeschule & Hundetrainer', '🦮', 'Welpenkurs, Einzelcoaching, Problemfälle', '#A16207', '#FEF3C7', 'alltag', 'alltag_tier', 'HUS', 'lead', 70, 'stunde', 'Welpenkurs, Einzelcoaching, Problemfälle', ARRAY['§11 TierSchG']::TEXT[], 161),
  ('alltag_tier_gro', 'Hunde-Grooming / Salon', '✂️', 'Waschen, Schneiden, Scheren, Pflege', '#A16207', '#FEF3C7', 'alltag', 'alltag_tier', 'GRO', 'lead', NULL, 'pauschal', 'Waschen, Schneiden, Scheren, Pflege', ARRAY['Gewerbe']::TEXT[], 162),
  ('alltag_tier_kat', 'Katzenbetreuung zu Hause', '🐈', 'Füttern, Spielen, Streu wechseln (Urlaub)', '#A16207', '#FEF3C7', 'alltag', 'alltag_tier', 'KAT', 'lead', 15, 'besuch', 'Füttern, Spielen, Streu wechseln (Urlaub)', ARRAY['Gewerbe']::TEXT[], 163),
  ('alltag_fam_bab', 'Babysitter', '👶', 'Stundenweise, abends, Wochenende', '#7C3AED', '#EDE9FE', 'alltag', 'alltag_fam', 'BAB', 'lead', 12, 'stunde', 'Stundenweise, abends, Wochenende', ARRAY['EFZ Pflicht']::TEXT[], 164),
  ('alltag_fam_tag', 'Tagesmutter / Tagespflege', '🧸', 'Ganztags, Halbtags, Kindbetreuung U3', '#7C3AED', '#EDE9FE', 'alltag', 'alltag_fam', 'TAG', 'lead', NULL, 'pauschal', 'Ganztags, Halbtags, Kindbetreuung U3', ARRAY['Pflegeerl.']::TEXT[], 165),
  ('alltag_fam_nah', 'Nachhilfe / Lernförderung', '📚', 'Mathematik, Englisch, Deutsch, Abitur', '#7C3AED', '#EDE9FE', 'alltag', 'alltag_fam', 'NAH', 'lead', 25, 'stunde', 'Mathematik, Englisch, Deutsch, Abitur', ARRAY[]::TEXT[], 166),
  ('alltag_fam_mus', 'Musikunterricht', '🎵', 'Klavier, Gitarre, Geige, Gesang', '#7C3AED', '#EDE9FE', 'alltag', 'alltag_fam', 'MUS', 'lead', 40, 'stunde', 'Klavier, Gitarre, Geige, Gesang', ARRAY[]::TEXT[], 167),
  ('alltag_fam_geb', 'Hebamme / Doula', '🤱', 'Schwangerschaftsbegleitung, Nachsorge', '#7C3AED', '#EDE9FE', 'alltag', 'alltag_fam', 'GEB', 'now', NULL, 'pauschal', 'Schwangerschaftsbegleitung, Nachsorge', ARRAY['Hebammen-Erl.']::TEXT[], 168),
  ('alltag_evt_fot', 'Fotograf', '📸', 'Hochzeit, Familie, Business, Porträt', '#B85C3A', '#FBE5DD', 'alltag', 'alltag_evt', 'FOT', 'lead', NULL, 'pauschal', 'Hochzeit, Familie, Business, Porträt', ARRAY['Gewerbe']::TEXT[], 169),
  ('alltag_evt_vid', 'Videograf & Filmproduktion', '🎥', 'Hochzeitsfilm, Imagefilm, Event-Recap', '#B85C3A', '#FBE5DD', 'alltag', 'alltag_evt', 'VID', 'lead', NULL, 'pauschal', 'Hochzeitsfilm, Imagefilm, Event-Recap', ARRAY['Gewerbe']::TEXT[], 170),
  ('alltag_evt_djd', 'DJ & Live-Musik', '🎧', 'Hochzeit, Geburtstag, Firmenfeier', '#B85C3A', '#FBE5DD', 'alltag', 'alltag_evt', 'DJD', 'lead', NULL, 'pauschal', 'Hochzeit, Geburtstag, Firmenfeier', ARRAY['GEMA']::TEXT[], 171),
  ('alltag_evt_cat', 'Catering & Partyservice', '🍽️', 'Buffet, Fingerfood, Hochzeit, Firmenevent', '#B85C3A', '#FBE5DD', 'alltag', 'alltag_evt', 'CAT', 'lead', NULL, 'pauschal', 'Buffet, Fingerfood, Hochzeit, Firmenevent', ARRAY['Lebensmittel-Hyg.']::TEXT[], 172),
  ('alltag_evt_evt', 'Eventplanung & Hochzeitsplaner', '🎉', 'Komplettplanung, Day-of-Coordination', '#B85C3A', '#FBE5DD', 'alltag', 'alltag_evt', 'EVT', 'lead', NULL, 'pauschal', 'Komplettplanung, Day-of-Coordination', ARRAY['Gewerbe']::TEXT[], 173),
  ('alltag_evt_dec', 'Dekoration & Floristik', '💐', 'Hochzeitsdeko, Blumen, Tafel, Räume', '#B85C3A', '#FBE5DD', 'alltag', 'alltag_evt', 'DEC', 'lead', NULL, 'pauschal', 'Hochzeitsdeko, Blumen, Tafel, Räume', ARRAY[]::TEXT[], 174),
  ('alltag_evt_mod', 'Moderator / Trauredner', '🎤', 'Freie Trauung, Hochzeit, Firmenfeier', '#B85C3A', '#FBE5DD', 'alltag', 'alltag_evt', 'MOD', 'lead', NULL, 'pauschal', 'Freie Trauung, Hochzeit, Firmenfeier', ARRAY[]::TEXT[], 175),
  ('alltag_sen_alt', 'Alltagshilfe & Haushaltshilfe Senioren', '🧓', 'Einkauf, Kochen, Begleitung, Putzen', '#0E7490', '#E0F7FA', 'alltag', 'alltag_sen', 'ALT', 'lead', 30, 'stunde', 'Einkauf, Kochen, Begleitung, Putzen', ARRAY['§45a-Anerk.']::TEXT[], 176),
  ('alltag_sen_bet', 'Betreuung & Gesellschaft', '🤝', 'Spaziergänge, Vorlesen, Demenz-Begleitung', '#0E7490', '#E0F7FA', 'alltag', 'alltag_sen', 'BET', 'lead', 28, 'stunde', 'Spaziergänge, Vorlesen, Demenz-Begleitung', ARRAY['§45a-Anerk.']::TEXT[], 177),
  ('alltag_sen_fah', 'Fahrdienst Senioren / Begleitung', '🚗', 'Arzt-Fahrten, Behörden, Begleitung', '#0E7490', '#E0F7FA', 'alltag', 'alltag_sen', 'FAH', 'lead', 35, 'stunde', 'Arzt-Fahrten, Behörden, Begleitung', ARRAY['P-Schein']::TEXT[], 178),
  ('alltag_sen_pfa', '24-Stunden-Pflege-Vermittlung', '👵', 'Vermittlung Pflegekraft (osteurop.)', '#0E7490', '#E0F7FA', 'alltag', 'alltag_sen', 'PFA', 'lead', NULL, 'pauschal', 'Vermittlung Pflegekraft (osteurop.)', ARRAY['§34c (Vermittl.)']::TEXT[], 179),
  ('alltag_sen_bar', 'Barriere-Umbau', '♿', 'Treppenlift, Wannentür, Haltegriffe', '#0E7490', '#E0F7FA', 'alltag', 'alltag_sen', 'BAR', 'lead', NULL, 'pauschal', 'Treppenlift, Wannentür, Haltegriffe', ARRAY['HWO A']::TEXT[], 180)
ON CONFLICT (id) DO UPDATE SET
  world_id          = EXCLUDED.world_id,
  area_id           = EXCLUDED.area_id,
  profession_code   = EXCLUDED.profession_code,
  pricing_model     = EXCLUDED.pricing_model,
  indicative_price  = EXCLUDED.indicative_price,
  price_unit        = EXCLUDED.price_unit,
  example_services  = EXCLUDED.example_services,
  requirements      = EXCLUDED.requirements;

-- ── LEAD-MARKETPLACE TABELLEN (Pay-per-Lead / Armut-Modell) ──
CREATE TABLE IF NOT EXISTS lead_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id       TEXT NOT NULL REFERENCES branches(id),
  customer_email  TEXT NOT NULL,
  customer_name   TEXT,
  customer_phone  TEXT,
  customer_plz    TEXT,
  customer_city   TEXT,
  description     TEXT NOT NULL,           -- Beschreibung des Auftrags vom Kunden
  budget_min      DECIMAL(10,2),
  budget_max      DECIMAL(10,2),
  preferred_date  DATE,
  urgency         TEXT CHECK (urgency IN ('asap','this_week','flexible')),
  status          TEXT NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open','assigned','in_progress','completed','cancelled')),
  max_purchases   INT NOT NULL DEFAULT 3,    -- Max Anbieter pro Lead
  lead_price_cents INT NOT NULL,             -- was Anbieter pro Kauf zahlt
  consent_provider_share BOOLEAN NOT NULL DEFAULT FALSE,
  consent_timestamp      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_lead_branch_status ON lead_requests(branch_id, status);
CREATE INDEX IF NOT EXISTS idx_lead_plz ON lead_requests(customer_plz);

CREATE TABLE IF NOT EXISTS lead_purchases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id         UUID NOT NULL REFERENCES lead_requests(id) ON DELETE CASCADE,
  provider_id     UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  price_cents     INT NOT NULL,
  stripe_payment_intent_id TEXT UNIQUE,
  purchased_at    TIMESTAMPTZ DEFAULT NOW(),
  status          TEXT NOT NULL DEFAULT 'purchased'
                  CHECK (status IN ('purchased','contacted','won','lost','refunded')),
  outcome_updated_at TIMESTAMPTZ,
  UNIQUE (lead_id, provider_id)
);
CREATE INDEX IF NOT EXISTS idx_lead_purch_provider ON lead_purchases(provider_id);

-- Provider lead-credit wallet (Anbieter laden Guthaben auf für Lead-Kauf)
ALTER TABLE providers ADD COLUMN IF NOT EXISTS lead_credit_cents INT NOT NULL DEFAULT 0;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS lead_radius_km    INT DEFAULT 25;

CREATE TABLE IF NOT EXISTS lead_credit_topups (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id       UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  amount_cents      INT NOT NULL,
  stripe_payment_intent_id TEXT UNIQUE,
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','completed','failed')),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  completed_at      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_credit_provider ON lead_credit_topups(provider_id);

COMMIT;

-- ── VERIFIZIERUNG ─────────────────────────────────────────
SELECT 'worlds' AS t, COUNT(*) FROM worlds
UNION ALL SELECT 'areas', COUNT(*) FROM areas
UNION ALL SELECT 'branches_total', COUNT(*) FROM branches
UNION ALL SELECT 'branches_pro', COUNT(*) FROM branches WHERE world_id='pro'
UNION ALL SELECT 'branches_alltag', COUNT(*) FROM branches WHERE world_id='alltag';

-- Übersicht: Berufe pro Bereich
SELECT a.world_id, a.num, a.name AS bereich, COUNT(b.id) AS berufe
FROM areas a LEFT JOIN branches b ON b.area_id = a.id
GROUP BY a.world_id, a.id, a.num, a.name, a.display_order
ORDER BY a.display_order;
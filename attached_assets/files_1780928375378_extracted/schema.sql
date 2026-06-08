-- =====================================================================
--  WattWechsel — Datenbankschema (PostgreSQL 15+)
--  Neutrale, KI-gestützte Energiewechsel-Plattform für die
--  Wohnungswirtschaft (Hausverwaltungen & Bestandshalter)
--
--  Designprinzipien:
--   1. Portfolio-Logik: Verwalter → Objekt → Zählpunkt → Vertrag
--   2. Compliance-by-Design: Vollmacht granular, widerrufbar, auditierbar
--   3. Vollständiger Audit-Trail für jede Aktion unter Vollmacht
--   4. Sparten Strom / Gas / Heizöl (unterschiedliche Logik)
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------
-- ENUM-Typen
-- ---------------------------------------------------------------------
CREATE TYPE sparte_t            AS ENUM ('strom', 'gas', 'heizoel', 'fernwaerme');
CREATE TYPE verwalter_typ_t     AS ENUM ('hausverwaltung', 'weg_verwalter', 'bestandshalter', 'gewerbe');
CREATE TYPE zaehler_art_t       AS ENUM ('allgemeinstrom', 'mieterstrom', 'gewerbe', 'heizung', 'waermepumpe', 'sonstige');
CREATE TYPE vollmacht_status_t  AS ENUM ('entwurf', 'aktiv', 'pausiert', 'widerrufen', 'abgelaufen');
CREATE TYPE vollmacht_modus_t   AS ENUM ('nur_vorschlag', 'freigabe_erforderlich', 'vollautomatisch');
CREATE TYPE wechsel_status_t    AS ENUM (
    'analyse',            -- KI vergleicht Tarife
    'empfehlung',         -- Empfehlung erstellt
    'wartet_freigabe',    -- Verwalter muss zustimmen
    'freigegeben',        -- zugestimmt / automatisch freigegeben
    'kuendigung_alt',     -- Altvertrag wird gekündigt
    'anmeldung_neu',      -- Neuvertrag wird angemeldet
    'aktiv',              -- Wechsel abgeschlossen
    'abgelehnt',          -- Verwalter hat abgelehnt
    'fehlgeschlagen',     -- technischer / fachlicher Fehler
    'widersprochen'       -- innerhalb Widerspruchsfrist gestoppt
);
CREATE TYPE provisionsmodell_t  AS ENUM ('saas_flat', 'erfolgsprovision', 'hybrid');

-- ---------------------------------------------------------------------
-- VERWALTER (Mandanten der Plattform)
-- ---------------------------------------------------------------------
CREATE TABLE verwalter (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firma               TEXT        NOT NULL,
    typ                 verwalter_typ_t NOT NULL,
    handelsregister_nr  TEXT,
    ust_id              TEXT,
    erlaubnis_34c       BOOLEAN     DEFAULT FALSE,   -- GewO §34c vorhanden?
    strasse             TEXT,
    plz                 VARCHAR(5),
    ort                 TEXT,
    iban_verschluesselt BYTEA,                       -- pgcrypto, nie im Klartext
    provisionsmodell    provisionsmodell_t NOT NULL DEFAULT 'saas_flat',
    aktiv               BOOLEAN     DEFAULT TRUE,
    erstellt_am         TIMESTAMPTZ DEFAULT now(),
    geaendert_am        TIMESTAMPTZ DEFAULT now()
);

-- Benutzerkonten je Verwalter (Rollen: admin, sachbearbeiter, leser)
CREATE TABLE benutzer (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    verwalter_id    UUID NOT NULL REFERENCES verwalter(id) ON DELETE CASCADE,
    email           CITEXT UNIQUE NOT NULL,
    name            TEXT NOT NULL,
    rolle           TEXT NOT NULL DEFAULT 'sachbearbeiter'
                        CHECK (rolle IN ('admin','sachbearbeiter','leser')),
    passwort_hash   TEXT NOT NULL,
    letzter_login   TIMESTAMPTZ,
    erstellt_am     TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------
-- OBJEKT (Gebäude/Liegenschaft)
-- ---------------------------------------------------------------------
CREATE TABLE objekt (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    verwalter_id    UUID NOT NULL REFERENCES verwalter(id) ON DELETE CASCADE,
    bezeichnung     TEXT NOT NULL,                   -- z. B. "WEG Kurfürstendamm 218"
    strasse         TEXT NOT NULL,
    plz             VARCHAR(5) NOT NULL,
    ort             TEXT NOT NULL,
    weg_beschluss   BOOLEAN DEFAULT FALSE,           -- liegt Eigentümerbeschluss vor?
    weg_beschluss_datum DATE,
    notiz           TEXT,
    erstellt_am     TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_objekt_verwalter ON objekt(verwalter_id);

-- ---------------------------------------------------------------------
-- ZÄHLPUNKT (Marktlokation — MaLo-ID)
-- ---------------------------------------------------------------------
CREATE TABLE zaehlpunkt (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    objekt_id           UUID NOT NULL REFERENCES objekt(id) ON DELETE CASCADE,
    sparte              sparte_t NOT NULL,
    art                 zaehler_art_t NOT NULL DEFAULT 'allgemeinstrom',
    malo_id             VARCHAR(11),                 -- Marktlokations-ID (Strom/Gas)
    zaehlernummer       TEXT,
    jahresverbrauch_kwh NUMERIC(12,2),               -- bei Öl: Liter/Jahr in separatem Feld
    jahresverbrauch_liter NUMERIC(12,2),             -- nur Heizöl
    netzbetreiber       TEXT,
    erstellt_am         TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_zaehlpunkt_objekt  ON zaehlpunkt(objekt_id);
CREATE INDEX idx_zaehlpunkt_sparte  ON zaehlpunkt(sparte);

-- ---------------------------------------------------------------------
-- VERTRAG (aktueller Liefervertrag je Zählpunkt)
-- ---------------------------------------------------------------------
CREATE TABLE vertrag (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zaehlpunkt_id       UUID NOT NULL REFERENCES zaehlpunkt(id) ON DELETE CASCADE,
    versorger           TEXT NOT NULL,
    tarifname           TEXT,
    arbeitspreis_ct_kwh NUMERIC(8,4),
    grundpreis_eur_jahr NUMERIC(10,2),
    vertragsbeginn      DATE,
    erstlaufzeit_ende   DATE,
    kuendigungsfrist_tage INT DEFAULT 30,
    naechster_kuendigungstermin DATE,                -- abgeleitet, von Engine berechnet
    preisgarantie_bis   DATE,
    ist_aktiv           BOOLEAN DEFAULT TRUE,
    quelle              TEXT DEFAULT 'manuell'        -- 'manuell' | 'ocr_rechnung' | 'wechsel'
        CHECK (quelle IN ('manuell','ocr_rechnung','wechsel')),
    erstellt_am         TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_vertrag_zaehlpunkt ON vertrag(zaehlpunkt_id);
CREATE INDEX idx_vertrag_kuendigung ON vertrag(naechster_kuendigungstermin)
    WHERE ist_aktiv = TRUE;

-- ---------------------------------------------------------------------
-- VOLLMACHT (Compliance-Kern)
--   Granular: pro Verwalter, optional auf Objekt-/Sparten-Ebene begrenzt.
--   Jederzeit widerrufbar (gesetzlich), inkl. Audit.
-- ---------------------------------------------------------------------
CREATE TABLE vollmacht (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    verwalter_id        UUID NOT NULL REFERENCES verwalter(id) ON DELETE CASCADE,
    objekt_id           UUID REFERENCES objekt(id) ON DELETE CASCADE, -- NULL = portfolioweit
    sparte              sparte_t,                    -- NULL = alle Sparten
    status              vollmacht_status_t NOT NULL DEFAULT 'entwurf',
    modus               vollmacht_modus_t  NOT NULL DEFAULT 'freigabe_erforderlich',
    -- Umfang (marktüblich, einzeln aktivierbar)
    darf_kuendigen          BOOLEAN DEFAULT TRUE,
    darf_abschliessen       BOOLEAN DEFAULT TRUE,
    darf_sonderkuendigung   BOOLEAN DEFAULT TRUE,
    darf_daten_abfragen     BOOLEAN DEFAULT TRUE,
    darf_bankdaten_weitergeben BOOLEAN DEFAULT TRUE,
    widerspruchsfrist_tage  INT DEFAULT 7,           -- Fenster vor Auto-Switch
    -- Lebenszyklus
    gueltig_ab          DATE,
    gueltig_bis         DATE,
    erteilt_von         UUID REFERENCES benutzer(id),
    erteilt_am          TIMESTAMPTZ,
    widerrufen_am       TIMESTAMPTZ,
    widerruf_grund      TEXT,
    dokument_pfad       TEXT,                        -- signiertes PDF
    erstellt_am         TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_vollmacht_verwalter ON vollmacht(verwalter_id);
CREATE INDEX idx_vollmacht_status    ON vollmacht(status);

-- ---------------------------------------------------------------------
-- WECHSELVORGANG (Status-Maschine)
-- ---------------------------------------------------------------------
CREATE TABLE wechselvorgang (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zaehlpunkt_id       UUID NOT NULL REFERENCES zaehlpunkt(id),
    vollmacht_id        UUID NOT NULL REFERENCES vollmacht(id),
    alt_vertrag_id      UUID REFERENCES vertrag(id),
    status              wechsel_status_t NOT NULL DEFAULT 'analyse',
    -- Empfehlung
    empf_versorger      TEXT,
    empf_tarif          TEXT,
    empf_arbeitspreis_ct_kwh NUMERIC(8,4),
    empf_grundpreis_eur_jahr NUMERIC(10,2),
    ersparnis_eur_jahr  NUMERIC(10,2),
    ersparnis_prozent   NUMERIC(5,2),
    anzahl_verglichene_anbieter INT,                 -- Transparenz gg. "Blackbox"
    ki_begruendung      TEXT,                        -- Claude-generierte Erklärung
    -- Freigabe / Widerspruch
    freigegeben_am      TIMESTAMPTZ,
    freigegeben_von     UUID REFERENCES benutzer(id),
    widerspruch_bis     TIMESTAMPTZ,                 -- Ende des Widerspruchsfensters
    -- Abschluss
    neu_vertrag_id      UUID REFERENCES vertrag(id),
    abgeschlossen_am    TIMESTAMPTZ,
    erstellt_am         TIMESTAMPTZ DEFAULT now(),
    geaendert_am        TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_wechsel_zaehlpunkt ON wechselvorgang(zaehlpunkt_id);
CREATE INDEX idx_wechsel_status     ON wechselvorgang(status);
CREATE INDEX idx_wechsel_widerspruch ON wechselvorgang(widerspruch_bis)
    WHERE status = 'wartet_freigabe';

-- ---------------------------------------------------------------------
-- AUDIT-LOG (jede Aktion unter Vollmacht — revisionssicher)
-- ---------------------------------------------------------------------
CREATE TABLE audit_log (
    id              BIGSERIAL PRIMARY KEY,
    verwalter_id    UUID REFERENCES verwalter(id),
    vollmacht_id    UUID REFERENCES vollmacht(id),
    wechsel_id      UUID REFERENCES wechselvorgang(id),
    akteur          TEXT NOT NULL,        -- 'system' | 'ki' | benutzer-email
    aktion          TEXT NOT NULL,        -- z. B. 'kuendigung_versendet'
    details         JSONB,
    ip_adresse      INET,
    zeitpunkt       TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_audit_verwalter ON audit_log(verwalter_id);
CREATE INDEX idx_audit_wechsel   ON audit_log(wechsel_id);
CREATE INDEX idx_audit_zeit      ON audit_log(zeitpunkt);

-- ---------------------------------------------------------------------
-- TARIF-FEED (Cache der Marktangebote, von Vergleichs-Engine befüllt)
-- ---------------------------------------------------------------------
CREATE TABLE tarif_angebot (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sparte              sparte_t NOT NULL,
    versorger           TEXT NOT NULL,
    tarifname           TEXT NOT NULL,
    arbeitspreis_ct_kwh NUMERIC(8,4),
    grundpreis_eur_jahr NUMERIC(10,2),
    laufzeit_monate     INT,
    preisgarantie_monate INT,
    oekostrom           BOOLEAN DEFAULT FALSE,
    min_verbrauch_kwh   NUMERIC(12,2),
    max_verbrauch_kwh   NUMERIC(12,2),
    plz_gebiet          VARCHAR(5),
    gueltig_ab          DATE,
    gueltig_bis         DATE,
    quelle              TEXT,                         -- Maklerpool / Feed-Anbieter
    abgerufen_am        TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_tarif_such ON tarif_angebot(sparte, plz_gebiet, gueltig_bis);

-- ---------------------------------------------------------------------
-- Trigger: geaendert_am automatisch pflegen
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_touch() RETURNS TRIGGER AS $$
BEGIN NEW.geaendert_am = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_verwalter_touch   BEFORE UPDATE ON verwalter
    FOR EACH ROW EXECUTE FUNCTION fn_touch();
CREATE TRIGGER trg_wechsel_touch     BEFORE UPDATE ON wechselvorgang
    FOR EACH ROW EXECUTE FUNCTION fn_touch();

-- ---------------------------------------------------------------------
-- View: Portfolio-Übersicht je Verwalter (für Dashboard-KPIs)
-- ---------------------------------------------------------------------
CREATE VIEW v_portfolio_kpi AS
SELECT
    v.id                          AS verwalter_id,
    v.firma,
    COUNT(DISTINCT o.id)          AS anzahl_objekte,
    COUNT(DISTINCT z.id)          AS anzahl_zaehlpunkte,
    COUNT(DISTINCT vt.id) FILTER (WHERE vt.ist_aktiv)            AS aktive_vertraege,
    COUNT(DISTINCT vt.id) FILTER (
        WHERE vt.naechster_kuendigungstermin
              BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '60 days'
    )                             AS kuendigungen_60_tage,
    COALESCE(SUM(wv.ersparnis_eur_jahr) FILTER (WHERE wv.status = 'aktiv'), 0)
                                  AS realisierte_ersparnis_eur
FROM verwalter v
LEFT JOIN objekt o      ON o.verwalter_id = v.id
LEFT JOIN zaehlpunkt z  ON z.objekt_id    = o.id
LEFT JOIN vertrag vt    ON vt.zaehlpunkt_id = z.id
LEFT JOIN wechselvorgang wv ON wv.zaehlpunkt_id = z.id
GROUP BY v.id, v.firma;

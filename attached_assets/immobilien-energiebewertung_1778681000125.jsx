import { useState, useEffect } from "react";

const GU = { wand: 0.24, dach: 0.24, fenster: 1.3, keller: 0.3 };
const PEF = { erdgas: { fp: 1.1, co2: 0.24 }, heizoel: { fp: 1.1, co2: 0.31 }, strom: { fp: 1.8, co2: 0.56 }, holz: { fp: 0.2, co2: 0.023 }, fw: { fp: 0.7, co2: 0.18 } };
const AGE = [{ ym: 1918, uw: 1.7, ur: 1.2, uf: 1, uwi: 5, d: "Gründerzeit" }, { ym: 1948, uw: 1.5, ur: 1.1, uf: 0.9, uwi: 4.7, d: "1919–48" }, { ym: 1968, uw: 1.2, ur: 0.9, uf: 0.8, uwi: 3.5, d: "1958–68" }, { ym: 1978, uw: 1, ur: 0.7, uf: 0.7, uwi: 3.1, d: "WSchV 77" }, { ym: 1994, uw: 0.6, ur: 0.4, uf: 0.5, uwi: 2.1, d: "WSchV 84" }, { ym: 2008, uw: 0.35, ur: 0.25, uf: 0.35, uwi: 1.5, d: "EnEV 02" }, { ym: 2015, uw: 0.24, ur: 0.2, uf: 0.3, uwi: 1.3, d: "EnEV 14" }, { ym: 2022, uw: 0.2, ur: 0.16, uf: 0.25, uwi: 1, d: "GEG 20" }, { ym: 2099, uw: 0.18, ur: 0.14, uf: 0.22, uwi: 0.9, d: "GEG 23" }];
const HT = [{ id: "gas_kt", l: "Gas-Konstanttemp.", f: "erdgas", e: 0.8, ee: 0, aus: 1 }, { id: "gas_bw", l: "Gas-Brennwert", f: "erdgas", e: 0.96, ee: 0 }, { id: "wp_luft", l: "Luft-WP", f: "strom", e: 3.5, ee: 100 }, { id: "wp_sole", l: "Sole-WP", f: "strom", e: 4.2, ee: 100 }, { id: "pellet", l: "Pellet", f: "holz", e: 0.92, ee: 100 }, { id: "fw", l: "Fernwärme", f: "fw", e: 0.98, ee: 50 }, { id: "elektro", l: "Nachtspeicher", f: "strom", e: 0.98, ee: 0 }];
const INS = [{ id: "none", l: "Keine", f: 1 }, { id: "w77", l: "WSchV 77", f: 0.7 }, { id: "w95", l: "WSchV 95", f: 0.55 }, { id: "enev", l: "EnEV", f: 0.42 }, { id: "kfw", l: "KfW 55", f: 0.32 }, { id: "pass", l: "Passivhaus", f: 0.22 }];
const WI = [{ id: "1f", l: "Einfach", u: 5, g: 0.87 }, { id: "2f_a", l: "2-fach alt", u: 2.8, g: 0.76 }, { id: "2f", l: "2-fach WSG", u: 1.3, g: 0.63 }, { id: "3f", l: "3-fach", u: 0.7, g: 0.5 }];
const BT = [{ id: "efh", l: "EFH" }, { id: "dhh", l: "DHH" }, { id: "rh", l: "Reihenhaus" }, { id: "mfh_s", l: "MFH 3-6" }, { id: "mfh_m", l: "MFH 7-12" }, { id: "mfh_l", l: "MFH >12" }];
const EC = [{ c: "A+", m: 30, col: "#00843D" }, { c: "A", m: 50, col: "#4CAF50" }, { c: "B", m: 75, col: "#8BC34A" }, { c: "C", m: 100, col: "#CDDC39" }, { c: "D", m: 130, col: "#FFEB3B" }, { c: "E", m: 160, col: "#FFC107" }, { c: "F", m: 200, col: "#FF9800" }, { c: "G", m: 250, col: "#FF5722" }, { c: "H", m: 999, col: "#D32F2F" }];
const CL = { 0: { d: 230, t: 8.5, l: "Ost" }, 1: { d: 228, t: 8.6, l: "Berlin" }, 2: { d: 225, t: 9, l: "Hamburg" }, 3: { d: 228, t: 8.8, l: "Mitte" }, 4: { d: 222, t: 9.2, l: "NRW" }, 5: { d: 218, t: 9.8, l: "Rhein" }, 6: { d: 215, t: 10, l: "Südwest" }, 7: { d: 225, t: 9, l: "BaWü" }, 8: { d: 235, t: 8.2, l: "Bayern" }, 9: { d: 232, t: 8.4, l: "Franken" } };
const gc = (p) => CL[parseInt((p || "6")[0])] || CL[6];
const PI = { 10: 1.35, 20: 1.42, 80: 1.88, 50: 1.22, 60: 1.48, 70: 1.38, 40: 1.32 };
const gpi = (p) => (p && p.length >= 2 ? PI[parseInt(p.substring(0, 2))] || 1 : 1);
const ga = (y) => AGE.find((a) => y <= a.ym) || AGE[AGE.length - 1];
const gbl = (p) => { if (!p || p.length < 2) return ""; const n = parseInt(p.substring(0, 2)); if (n >= 10 && n <= 12) return "Berlin"; if (n >= 20 && n <= 21) return "Hamburg"; if (n >= 40 && n <= 59) return "NRW"; if (n >= 60 && n <= 65) return "Hessen"; if (n >= 68 && n <= 79 || n >= 88 && n <= 89) return "Baden-Württemberg"; if (n >= 80 && n <= 97) return "Bayern"; return ""; };
const PC = { 10: [52.52, 13.4], 20: [53.55, 9.99], 30: [52.37, 9.74], 40: [51.23, 6.78], 50: [50.94, 6.96], 60: [50.11, 8.68], 70: [48.78, 9.18], 80: [48.14, 11.58], 90: [49.45, 11.08] };
const gco = (p) => (p && p.length >= 2 ? PC[parseInt(p.substring(0, 2))] || [51.16, 10.45] : [51.16, 10.45]);

const SSP = [
  { id: "ssp126", l: "SSP1-2.6 Best", t30: 1.2, t50: 1.5, t80: 1.6, col: "#4CAF50" },
  { id: "ssp245", l: "SSP2-4.5 Moderat", t30: 1.3, t50: 1.8, t80: 2.4, col: "#FFC107" },
  { id: "ssp585", l: "SSP5-8.5 Worst", t30: 1.4, t50: 2.3, t80: 4.2, col: "#D32F2F" },
];

const BPI = 1.487;
function cW(d) { const n = ({ efh: 1520, dhh: 1420, rh: 1350, mfh_s: 1280, mfh_m: 1220, mfh_l: 1180 })[d.bt] || 1280; const af = Math.max(0.3, 1 - (2026 - d.by) * 0.008); const w = n * d.area * af; return { w1914: Math.round(w / BPI / 12.782), w2010: Math.round(w), wAkt: Math.round(w * BPI / 100) * 100, nhk: n, af: Math.round(af * 100) / 100 }; }
function cRnd(d, e, w) { const gnd = ["efh", "dhh", "rh"].includes(d.bt) ? 80 : 60; const alt = 2026 - d.by; const rR = Math.max(0, gnd - alt); const zf = "HG".includes(e.ec.c) ? 0.5 : "F" === e.ec.c ? 0.65 : "E" === e.ec.c ? 0.75 : "D" === e.ec.c ? 0.85 : 1; const rW = Math.max(5, Math.round(rR * zf)); const aN = d.by < 1925 ? 2.5 : 2; const aV = rW > 0 ? Math.round(100 / rW * 100) / 100 : 0; const bm = Math.round(w.wAkt * 0.7); const aNj = Math.round(bm * aN / 100); const aVj = Math.round(bm * aV / 100); const mehr = aVj - aNj; const gV = aV > aN && mehr > 500; return { gnd, alt, rR, rW, aN, aV, bm, aNj, aVj, mehr, s35: Math.round(mehr * 0.35), gV, gK: ["efh", "dhh", "rh"].includes(d.bt) ? 1500 : 2500 }; }
function cRisk(p, d) { const lat = gco(p)[0]; const st = lat > 52 ? 3 : lat > 50 ? 2 : 1; const ht = gc(p).t > 9.5 ? 3 : gc(p).t > 8.5 ? 2 : 1; const bg = d.by < 1960 ? 3 : d.by < 1990 ? 2 : 1; const tot = Math.round((st * 30 + ht * 25 + bg * 25) / 3); return { st, ht, bg, tot, lv: tot <= 25 ? "Gering" : tot <= 50 ? "Mittel" : "Erhöht", col: tot <= 25 ? "#4CAF50" : tot <= 50 ? "#FFC107" : "#FF9800" }; }
function cESG(e) { return { crr: e.eps <= 55 ? "On Track" : "Off Track", tax: e.eps <= 100 }; }
function cSol(d) { const r = d.area / Math.max(d.fl, 1) * 0.6; const k = Math.round(r / 7); return { r: Math.round(r), k, kwh: k * 950, eur: Math.round(k * 950 * 0.12) }; }
function din(d) { const ag = ga(d.by); const h = HT.find((x) => x.id === d.ht) || HT[0]; const ins = INS.find((x) => x.id === d.ins) || INS[0]; const wi = WI.find((x) => x.id === d.win) || WI[0]; const cl = gc(d.plz); const hf = 2.8; const fp = d.area / Math.max(d.fl, 1); const pr = 4 * Math.sqrt(fp); const wA = pr * d.fl * hf; const wn = wA * 0.2; const ow = wA * 0.8; const uw = ag.uw * ins.f; const ur = ag.ur * ins.f; const uf = ag.uf * ins.f; const eA = ow + fp * 2 + wn; const htT = ow * uw + fp * ur + fp * uf + wn * wi.u; const vol = d.area * hf; const hdd = cl.d * (20 - cl.t); const qT = htT * hdd * 24 / 1e3; const qV = 0.34 * 0.5 * vol * hdd * 24 / 1e3; const qS = wn * wi.g * 350 * 0.9; const qI = 5 * d.area * cl.d * 24 / 1e3; const qH = Math.max(0, (qT + qV) * 0.95 - qS * 0.9 - qI * 0.8); const qW = 12.5 * d.area; const endE = (qH + qW) / h.e; const eps = Math.round(endE / d.area); const fuel = PEF[h.f] || PEF.erdgas; const ec = EC.find((c) => eps <= c.m) || EC[8]; const pfl = []; if (h.aus && 2026 - (d.hy || d.by) >= 30) pfl.push("§72 GEG: Austauschpflicht >30J"); if ((h.ee || 0) < 65) pfl.push("§71 GEG: 65%-EE-Pflicht bei Heizungstausch"); return { eps, pps: Math.round(endE * fuel.fp / d.area), co2t: Math.round(endE * fuel.co2 / 1e3 * 10) / 10, co2s: Math.round(endE * fuel.co2 / d.area * 10) / 10, ec, htP: Math.round(htT / eA * 100) / 100, uv: { w: Math.round(uw * 100) / 100, r: Math.round(ur * 100) / 100, f: Math.round(uf * 100) / 100, wn: wi.u }, ag, pfl, qH: Math.round(qH), qW: Math.round(qW), endE: Math.round(endE), vol: Math.round(vol), eA: Math.round(eA), avR: Math.round(eA / vol * 100) / 100 }; }
function cVal(d, e) { const b = d.by >= 2020 ? 3400 : d.by >= 2000 ? 2500 : d.by >= 1980 ? 2000 : 1500; const ci = EC.indexOf(e.ec); return { tot: Math.round(b * (1.2 - ci * 0.055) * gpi(d.plz) * d.area), ps: Math.round(b * (1.2 - ci * 0.055) * gpi(d.plz)) }; }
function cRen(kw, d, e) { const sc = []; EC.filter((c) => c.m < kw).slice(0, 3).forEach((t) => { const ms = []; let rem = kw - t.m; let tc = 0; if (rem > 5 && e.uv.w > 0.24) { const sv = Math.min(rem * 0.3, 55); const c = d.area * 155; ms.push({ n: "Fassade", c, sv }); rem -= sv; tc += c; } if (rem > 5 && e.uv.wn > 1.3) { const sv = Math.min(rem * 0.18, 28); const c = d.area * 90; ms.push({ n: "Fenster", c, sv }); rem -= sv; tc += c; } if (rem > 5 && (e.ec.c === "G" || e.ec.c === "H" || e.ec.c === "F")) { const sv = Math.min(rem * 0.4, 65); const c = d.area * 120; ms.push({ n: "Heizung→WP", c, sv }); rem -= sv; tc += c; } if (rem > 3) { const c = d.area * 50; ms.push({ n: "Dach+Keller", c, sv: Math.min(rem * 0.25, 30) }); tc += c; } sc.push({ cls: t.c, ms, tc }); }); return sc; }

function genPDF(d, e, w, rnd, ri, sol) {
  const html = `<html><head><style>body{font-family:Arial,sans-serif;padding:30px;font-size:13px}h1{color:#1a5f3a}h2{color:#1a4a6a;border-bottom:2px solid #e8edf2;padding-bottom:5px;margin-top:20px}table{width:100%;border-collapse:collapse;margin:10px 0}td{padding:5px 8px;border-bottom:1px solid #eee}.v{font-weight:600;text-align:right}.ec{display:inline-block;padding:4px 12px;border-radius:6px;color:#fff;font-weight:700;font-size:18px;background:${e.ec.col}}</style></head><body><h1>ImmoEnergiePro – GebäudeReport</h1><p>${d.str} ${d.nr}, ${d.plz} ${d.city} · ${new Date().toLocaleDateString("de-DE")}</p><h2>VALUE</h2><table><tr><td>Wert 1914</td><td class="v">${w.w1914.toLocaleString("de-DE")} M</td></tr><tr><td>NHK 2010</td><td class="v">${w.w2010.toLocaleString("de-DE")} €</td></tr><tr><td>Aktuell (BPI ${BPI})</td><td class="v">${w.wAkt.toLocaleString("de-DE")} €</td></tr><tr><td>RND wirtschaftlich</td><td class="v">${rnd.rW} Jahre</td></tr><tr><td>AfA verkürzt</td><td class="v">${rnd.aV}% = ${rnd.aVj.toLocaleString("de-DE")} €/a</td></tr></table><h2>RISK</h2><table><tr><td>Risiko-Score</td><td class="v">${ri.tot}/100 (${ri.lv})</td></tr></table><h2>ENERGY</h2><p>Klasse: <span class="ec">${e.ec.c}</span></p><table><tr><td>Endenergie</td><td class="v">${e.eps} kWh/(m²·a)</td></tr><tr><td>CO₂</td><td class="v">${e.co2t} t/a</td></tr><tr><td>Solar</td><td class="v">${sol.k} kWp = ${sol.kwh} kWh/a</td></tr></table></body></html>`;
  const win = window.open("", "_blank");
  if (win) { win.document.write(html); win.document.close(); setTimeout(() => win.print(), 500); }
}

const FDB = [
  { nm: "Heizung KfW 458", sa: "30%+Boni=70%", mx: "30.000€/WE", tg: ["hz"] },
  { nm: "Gebäudehülle BAFA", sa: "15%+5%iSFP=20%", mx: "60.000€/WE", tg: ["da", "fe"] },
  { nm: "Effizienzhaus KfW 261", sa: "Bis 45% TZ", mx: "150.000€/WE", tg: ["ko"] },
  { nm: "§35c Steuerbonus", sa: "20%/3 Jahre", mx: "40.000€", tg: ["st"] },
  { nm: "iSFP BAFA", sa: "80% Zuschuss", mx: "1.700€", tg: ["be"] },
];
const FCAT = [{ id: "hz", l: "🔥 Heizung" }, { id: "da", l: "🧱 Fassade" }, { id: "fe", l: "🪟 Fenster" }, { id: "ko", l: "🏗️ Komplett" }, { id: "be", l: "📋 iSFP" }, { id: "st", l: "📊 Steuer" }];

const ISF = [
  { ct: "Gebäude", fs: [{ id: "bj", l: "Baujahr", tp: "number", bi: "by" }, { id: "typ", l: "Typ", tp: "select", op: BT, bi: "bt" }, { id: "we", l: "WE", tp: "number", bi: "we" }, { id: "ngf", l: "NGF m²", tp: "number", bi: "area" }, { id: "fl", l: "Geschosse", tp: "number", bi: "fl" }] },
  { ct: "Hülle", fs: [{ id: "fas", l: "Dämmung", tp: "select", op: INS, bi: "ins" }, { id: "fen", l: "Fenster", tp: "select", op: WI, bi: "win" }, { id: "fen_bj", l: "Fenster BJ", tp: "number" }] },
  { ct: "Technik", fs: [{ id: "hz", l: "Heizung", tp: "select", op: HT, bi: "ht" }, { id: "hz_bj", l: "Heizung BJ", tp: "number", bi: "hy" }, { id: "pv", l: "PV kWp", tp: "number" }] },
  { ct: "Verbrauch", fs: [{ id: "vb1", l: "Verbrauch J1 kWh", tp: "number" }, { id: "vb2", l: "Verbrauch J2 kWh", tp: "number" }, { id: "hkost", l: "Heizkosten €/a", tp: "number" }] },
];

const FONT = "https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Fraunces:opsz,wght@9..144,500;9..144,700&display=swap";
const RL = { investor: "Investor", bank: "Bank", versicherung: "Versicherung", privat: "Privat", berater: "Energieberater", handwerker: "Handwerker" };
const RI = { investor: "📊", bank: "🏦", versicherung: "🛡️", privat: "🏠", berater: "⚡", handwerker: "🔧" };
const RC = { investor: "#1a5f3a", bank: "#1a4a6a", versicherung: "#5a3a6a", privat: "#2a6a8a", berater: "#6a5a1a", handwerker: "#8a3a1a" };

const CD = { background: "#fff", borderRadius: 12, padding: 14, boxShadow: "0 1px 3px rgba(0,0,0,.03),0 4px 12px rgba(0,0,0,.03)", marginBottom: 10 };

function Stat({ l, v, s, a }) {
  return (
    <div style={{ background: `linear-gradient(135deg,${a}06,${a}12)`, border: `1px solid ${a}20`, borderRadius: 9, padding: "7px 9px", flex: 1, minWidth: 80 }}>
      <div style={{ fontFamily: "'DM Sans'", fontSize: 9, color: "#6a7a8a", fontWeight: 500, textTransform: "uppercase" }}>{l}</div>
      <div style={{ fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 700, color: a, lineHeight: 1.1 }}>{v}</div>
      {s && <div style={{ fontFamily: "'DM Sans'", fontSize: 9, color: "#8a9aaa", marginTop: 1 }}>{s}</div>}
    </div>
  );
}

function Field({ label, type, value, onChange, suffix, options, placeholder, disabled, hint }) {
  const base = { padding: "7px 9px", borderRadius: 7, border: "1.5px solid #dde3ea", fontFamily: "'DM Sans'", fontSize: 12, background: disabled ? "#eee" : "#f8fafc", color: "#1a2a3a", outline: "none", width: "100%", boxSizing: "border-box" };
  if (options) {
    return (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <label style={{ fontFamily: "'DM Sans'", fontSize: 10, fontWeight: 500, color: "#5a6a7a", marginBottom: 1 }}>{label}</label>
        <select value={value} onChange={(ev) => onChange(ev.target.value)} style={{ ...base, cursor: "pointer" }}>
          {options.map((o) => <option key={o.id || o.v} value={o.id || o.v}>{o.l}</option>)}
        </select>
        {hint && <span style={{ fontFamily: "'DM Sans'", fontSize: 8.5, color: "#a0aab4" }}>{hint}</span>}
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <label style={{ fontFamily: "'DM Sans'", fontSize: 10, fontWeight: 500, color: "#5a6a7a", marginBottom: 1 }}>{label}</label>
      <div style={{ position: "relative" }}>
        <input type={type || "number"} value={value} onChange={(ev) => onChange(!type || type === "number" ? Number(ev.target.value) : ev.target.value)} placeholder={placeholder} disabled={disabled} style={{ ...base, paddingRight: suffix ? 30 : 9 }} />
        {suffix && <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontFamily: "'DM Sans'", fontSize: 9, color: "#8a9aaa" }}>{suffix}</span>}
      </div>
      {hint && <span style={{ fontFamily: "'DM Sans'", fontSize: 8.5, color: "#a0aab4" }}>{hint}</span>}
    </div>
  );
}

function EnergyBar({ kw }) {
  const ec = EC.find((c) => kw <= c.m) || EC[8];
  return (
    <div style={{ display: "flex", borderRadius: 7, overflow: "hidden", height: 26 }}>
      {EC.map((c) => (
        <div key={c.c} style={{ flex: 1, background: c.c === ec.c ? c.col : c.col + "18", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans'", fontSize: c.c === ec.c ? 10.5 : 8.5, fontWeight: c.c === ec.c ? 700 : 400, color: c.c === ec.c ? "#fff" : "#aaa", transform: c.c === ec.c ? "scaleY(1.1)" : "scaleY(1)", zIndex: c.c === ec.c ? 2 : 1, borderRadius: c.c === ec.c ? 4 : 0, boxShadow: c.c === ec.c ? `0 2px 6px ${c.col}55` : "none", transition: "all 0.3s" }}>{c.c}</div>
      ))}
    </div>
  );
}

function AerialMap({ plz, ec, d }) {
  const [lat, lng] = gco(plz);
  const z = 15;
  const tX = Math.floor((lng + 180) / 360 * Math.pow(2, z));
  const tY = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, z));
  const [mode, setMode] = useState("aerial");
  const url = mode === "aerial" ? `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${tY}/${tX}` : `https://tile.openstreetmap.org/${z}/${tX}/${tY}.png`;

  return (
    <div style={{ borderRadius: 10, overflow: "hidden", position: "relative", width: "100%", height: 180, background: "#e8edf2" }}>
      <img src={url} alt="Karte" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(ev) => { ev.target.style.display = "none"; }} />
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 36, height: 36, border: `3px solid ${ec ? ec.col : "#2a8f5a"}`, borderRadius: 8, background: `${ec ? ec.col : "#2a8f5a"}20` }} />
      <div style={{ position: "absolute", top: 6, right: 6, display: "flex", gap: 3 }}>
        <button onClick={() => setMode("aerial")} style={{ padding: "3px 8px", borderRadius: 5, border: "none", background: mode === "aerial" ? "#000c" : "#fffc", color: mode === "aerial" ? "#fff" : "#333", fontFamily: "'DM Sans'", fontSize: 9, cursor: "pointer" }}>Luftbild</button>
        <button onClick={() => setMode("map")} style={{ padding: "3px 8px", borderRadius: 5, border: "none", background: mode === "map" ? "#000c" : "#fffc", color: mode === "map" ? "#fff" : "#333", fontFamily: "'DM Sans'", fontSize: 9, cursor: "pointer" }}>Karte</button>
      </div>
      <div style={{ position: "absolute", bottom: 6, left: 6, background: "#000a", padding: "3px 8px", borderRadius: 5, fontFamily: "'DM Sans'", fontSize: 9, color: "#fff" }}>
        📍 {plz || "—"} {d.city || ""} · {lat.toFixed(3)},{lng.toFixed(3)}
      </div>
    </div>
  );
}

function AddrInput({ value, onChange, onSelect }) {
  const [sug, setSug] = useState([]);
  const [show, setShow] = useState(false);
  const search = async (q) => {
    onChange(q);
    if (q.length < 3) { setSug([]); return; }
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q + ", Deutschland")}&format=json&addressdetails=1&limit=5`);
      const data = await r.json();
      setSug(data.map((d2) => ({ display: (d2.display_name || "").split(",").slice(0, 3).join(", "), plz: d2.address?.postcode || "", city: d2.address?.city || d2.address?.town || "", street: d2.address?.road || "", nr: d2.address?.house_number || "" })));
      setShow(true);
    } catch { setSug([]); }
  };

  return (
    <div style={{ position: "relative", marginBottom: 6 }}>
      <Field label="🔍 Adresse suchen (Autovervollständigung)" type="text" value={value} onChange={search} placeholder="Straße, PLZ, Ort eingeben..." />
      {show && sug.length > 0 && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #dde3ea", borderRadius: 8, zIndex: 10, maxHeight: 150, overflowY: "auto", boxShadow: "0 4px 12px rgba(0,0,0,.1)" }}>
          {sug.map((s, i) => (
            <div key={i} onClick={() => { onSelect(s); setShow(false); }} style={{ padding: "7px 10px", cursor: "pointer", fontFamily: "'DM Sans'", fontSize: 11, borderBottom: "1px solid #f0f4f8" }}>
              📍 {s.display}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [vw, setVw] = useState("landing");
  const [us, setUs] = useState(null);
  const [an, setAn] = useState(true);
  const [tb, setTb] = useState("value");
  const [sspSel, setSspSel] = useState("ssp245");
  const [d, setD] = useState({ str: "", nr: "", plz: "", city: "", bl: "", by: 1975, hy: 0, we: 6, area: 480, fl: 4, bt: "mfh_s", ht: "gas_kt", ins: "w77", win: "2f_a", addrFull: "" });
  const u = (k, v) => setD((p) => ({ ...p, [k]: v }));
  useEffect(() => { if (d.plz.length >= 2) u("bl", gbl(d.plz)); }, [d.plz]);
  const [sT, setST] = useState(0);
  const [iC, setIC] = useState({});
  const [fS, setFS] = useState([]);
  const [rg, setRg] = useState({ role: "privat", name: "", email: "", ebNr: "" });
  const [cB, setCB] = useState({ name: "", regNr: "" });
  const [wlCfg, setWlCfg] = useState({ brand: "ImmoEnergiePro", color: "#2a8f5a" });
  const iSet = (id, val) => { setIC((p) => ({ ...p, [id]: val })); const af = ISF.flatMap((c) => c.fs).find((f) => f.id === id); if (af && af.bi && val !== "" && val !== undefined) u(af.bi, af.tp === "number" ? Number(val) : val); };
  const go = (v) => { setAn(false); setTimeout(() => { setVw(v); setAn(true); }, 140); };
  const addrSelect = (s) => { u("str", s.street); u("nr", s.nr); u("plz", s.plz); u("city", s.city); u("addrFull", s.display); };

  const e = din(d); const val = cVal(d, e); const sc = cRen(e.eps, d, e); const cS = sc[sT] || sc[0]; const w = cW(d); const rnd = cRnd(d, e, w); const ri = cRisk(d.plz, d); const esg = cESG(e); const sol = cSol(d);
  const mF = FDB.filter((f) => fS.length > 0 && f.tg.some((t) => fS.includes(t)));
  const ssp = SSP.find((s) => s.id === sspSel) || SSP[1];
  const userApiKey = `sk_${us?.role || "demo"}_${(us?.id || "0")}`;
  const brandCol = wlCfg.color;
  const nav = [{ v: "dashboard", l: "Dashboard" }, { v: "assess", l: "Value·Risk·Energy" }, { v: "isfp", l: "iSFP" }, { v: "cert", l: "Ausweis" }, { v: "foerder", l: "Förderung" }, { v: "api", l: "API" }];
  const g3 = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 7 };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(165deg,#eef2ee,#e5ece5 30%,#f3f5f3)", fontFamily: "'DM Sans',sans-serif" }}>
      <link href={FONT} rel="stylesheet" />
      <style>{`*{box-sizing:border-box;margin:0;padding:0}input:focus,select:focus{border-color:${brandCol}!important}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#c0c8d0;border-radius:3px}`}</style>

      <div style={{ background: "linear-gradient(135deg,#0d2818,#1a4a2e)", padding: "12px 10px 8px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span onClick={() => go(us ? "dashboard" : "landing")} style={{ fontFamily: "'Fraunces',serif", fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer" }}>🏢 {wlCfg.brand}</span>
          </div>
          {us && <button onClick={() => { setUs(null); go("landing"); }} style={{ padding: "2px 7px", borderRadius: 4, border: "1px solid rgba(255,255,255,.15)", background: "none", color: "rgba(255,255,255,.4)", fontSize: 9, cursor: "pointer" }}>Logout</button>}
        </div>
      </div>

      {us && !["landing", "login", "register"].includes(vw) && (
        <div style={{ background: "#fff", borderBottom: "1px solid #e8edf2", overflowX: "auto" }}>
          <div style={{ maxWidth: 960, margin: "0 auto", display: "flex" }}>
            {nav.map((n) => (
              <button key={n.v} onClick={() => go(n.v)} style={{ padding: "7px 10px", border: "none", borderBottom: vw === n.v ? `2px solid ${brandCol}` : "2px solid transparent", background: "none", fontFamily: "'DM Sans'", fontSize: 10.5, fontWeight: vw === n.v ? 600 : 400, color: vw === n.v ? "#1a2a3a" : "#8a9aaa", cursor: "pointer", whiteSpace: "nowrap" }}>{n.l}</button>
            ))}
          </div>
        </div>
      )}

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "10px 8px 28px", opacity: an ? 1 : 0, transform: an ? "translateY(0)" : "translateY(5px)", transition: "opacity .14s" }}>

        {vw === "landing" && (
          <div>
            <div style={{ textAlign: "center", padding: "20px 8px 14px" }}>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 700, color: "#0d2818", lineHeight: 1.2 }}>Value · Risk · Energy</div>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 16, color: brandCol, marginBottom: 10 }}>Gebäudedaten-Plattform & SaaS API</div>
              <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                <button onClick={() => go("login")} style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: brandCol, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Einloggen</button>
                <button onClick={() => go("register")} style={{ padding: "9px 20px", borderRadius: 8, border: `2px solid ${brandCol}`, background: "#fff", color: brandCol, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Registrieren</button>
              </div>
            </div>
            <div style={{ ...CD, background: "#f0f7ff", border: "1px solid #c0d8f0" }}>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 14, fontWeight: 600, color: "#1a3a6a", marginBottom: 6 }}>💰 Fördermittelservice</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
                {FCAT.map((fc) => (
                  <label key={fc.id} style={{ display: "flex", gap: 4, alignItems: "center", padding: "4px 8px", borderRadius: 6, border: fS.includes(fc.id) ? `1.5px solid ${brandCol}` : "1.5px solid #e8edf2", background: fS.includes(fc.id) ? "#f0faf5" : "#fafbfc", cursor: "pointer", fontSize: 10.5 }}>
                    <input type="checkbox" checked={fS.includes(fc.id)} onChange={() => setFS((p) => p.includes(fc.id) ? p.filter((x) => x !== fc.id) : [...p, fc.id])} style={{ accentColor: brandCol, width: 13, height: 13 }} />
                    {fc.l}
                  </label>
                ))}
              </div>
              {mF.map((f, i) => (
                <div key={i} style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid #d0d8e0", marginBottom: 3, fontSize: 11 }}>
                  <strong>{f.nm}</strong> · <span style={{ color: "#1a5f3a", fontWeight: 600 }}>{f.sa}</span> · Max: {f.mx}
                </div>
              ))}
            </div>
          </div>
        )}

        {vw === "login" && (
          <div style={{ maxWidth: 340, margin: "14px auto" }}>
            <div style={CD}>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 600, textAlign: "center", marginBottom: 10 }}>Anmelden</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 3, marginBottom: 10 }}>
                {Object.entries(RL).map(([k, v]) => (
                  <button key={k} onClick={() => setRg((p) => ({ ...p, role: k }))} style={{ padding: "6px 2px", borderRadius: 6, border: rg.role === k ? `2px solid ${RC[k]}` : "2px solid #e8edf2", background: rg.role === k ? RC[k] + "10" : "#f8fafc", cursor: "pointer", textAlign: "center" }}>
                    <div style={{ fontSize: 14 }}>{RI[k]}</div>
                    <div style={{ fontSize: 8, color: rg.role === k ? RC[k] : "#6a7a8a" }}>{v}</div>
                  </button>
                ))}
              </div>
              <div style={{ marginBottom: 6 }}><Field label="E-Mail" type="text" value={rg.email} onChange={(v) => setRg((p) => ({ ...p, email: v }))} placeholder="name@firma.de" /></div>
              <button onClick={() => { setUs({ ...rg, id: Date.now().toString(36) }); go("dashboard"); }} style={{ width: "100%", padding: "9px", borderRadius: 8, border: "none", background: RC[rg.role], color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Anmelden</button>
              <div style={{ textAlign: "center", marginTop: 6 }}><button onClick={() => go("register")} style={{ background: "none", border: "none", fontSize: 10, color: brandCol, cursor: "pointer" }}>Registrieren →</button></div>
            </div>
          </div>
        )}

        {vw === "register" && (
          <div style={{ maxWidth: 380, margin: "14px auto" }}>
            <div style={CD}>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 600, textAlign: "center", marginBottom: 10 }}>Registrieren</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 3, marginBottom: 10 }}>
                {Object.entries(RL).map(([k, v]) => (
                  <button key={k} onClick={() => setRg((p) => ({ ...p, role: k }))} style={{ padding: "6px 2px", borderRadius: 6, border: rg.role === k ? `2px solid ${RC[k]}` : "2px solid #e8edf2", background: rg.role === k ? RC[k] + "10" : "#f8fafc", cursor: "pointer", textAlign: "center" }}>
                    <div style={{ fontSize: 14 }}>{RI[k]}</div>
                    <div style={{ fontSize: 8, color: rg.role === k ? RC[k] : "#6a7a8a" }}>{v}</div>
                  </button>
                ))}
              </div>
              <div style={{ marginBottom: 6 }}><Field label="Name" type="text" value={rg.name} onChange={(v) => setRg((p) => ({ ...p, name: v }))} placeholder="Max Mustermann" /></div>
              <div style={{ marginBottom: 6 }}><Field label="E-Mail" type="text" value={rg.email} onChange={(v) => setRg((p) => ({ ...p, email: v }))} placeholder="name@firma.de" /></div>
              {rg.role === "berater" && <div style={{ marginBottom: 6, padding: "6px", borderRadius: 7, background: "#fef9f0", border: "1px solid #f0e0c0" }}><Field label="Reg.-Nr. (dena/BAFA)" type="text" value={rg.ebNr} onChange={(v) => setRg((p) => ({ ...p, ebNr: v }))} placeholder="EBW-12345" /></div>}
              <button onClick={() => { setUs({ ...rg, id: Date.now().toString(36) }); go("dashboard"); }} style={{ width: "100%", padding: "9px", borderRadius: 8, border: "none", background: RC[rg.role], color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Konto erstellen & API-Key erhalten</button>
            </div>
          </div>
        )}

        {vw === "dashboard" && us && (
          <div style={{ ...CD, background: RC[us.role] + "10", border: `1px solid ${RC[us.role]}25` }}>
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{RI[us.role]} Willkommen{us.name ? `, ${us.name}` : ""}</div>
            <div style={{ fontSize: 10, color: "#6a7a8a", marginBottom: 8 }}>{RL[us.role]} · API: <code style={{ background: "#f0f4f8", padding: "1px 4px", borderRadius: 3, fontSize: 9 }}>{userApiKey}</code></div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              <button onClick={() => go("assess")} style={{ padding: "7px 14px", borderRadius: 7, border: "none", background: brandCol, color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>📐 Analyse</button>
              <button onClick={() => go("isfp")} style={{ padding: "7px 14px", borderRadius: 7, border: `1.5px solid ${brandCol}`, background: "#fff", color: brandCol, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>📋 iSFP</button>
              <button onClick={() => go("api")} style={{ padding: "7px 14px", borderRadius: 7, border: "1.5px solid #1a4a6a", background: "#fff", color: "#1a4a6a", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>🔌 API</button>
            </div>
          </div>
        )}

        {vw === "assess" && us && (
          <div>
            <div style={CD}>
              <AddrInput value={d.addrFull} onChange={(v) => u("addrFull", v)} onSelect={addrSelect} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 60px 75px 1fr", gap: 6, marginBottom: 6 }}>
                <Field label="Straße" type="text" value={d.str} onChange={(v) => u("str", v)} placeholder="Musterstr." />
                <Field label="Nr." type="text" value={d.nr} onChange={(v) => u("nr", v)} placeholder="42" />
                <Field label="PLZ" type="text" value={d.plz} onChange={(v) => u("plz", v.slice(0, 5))} placeholder="80331" />
                <Field label="Ort" type="text" value={d.city} onChange={(v) => u("city", v)} placeholder="München" />
              </div>
              <div style={{ fontSize: 9, color: "#8a9aaa", marginBottom: 6 }}>{d.bl ? d.bl + " · " : ""}{gc(d.plz).l} · {gc(d.plz).d} Heiztage · Idx {gpi(d.plz).toFixed(2)}</div>
              <AerialMap plz={d.plz} ec={e.ec} d={d} />
              <div style={{ ...g3, marginTop: 8 }}>
                <Field label="Baujahr" value={d.by} onChange={(v) => u("by", v)} hint={ga(d.by).d} />
                <Field label="Typ" value={d.bt} onChange={(v) => u("bt", v)} options={BT} />
                <Field label="WE" value={d.we} onChange={(v) => u("we", v)} />
                <Field label="NGF" value={d.area} onChange={(v) => u("area", v)} suffix="m²" />
                <Field label="Geschosse" value={d.fl} onChange={(v) => u("fl", v)} />
                <Field label="Heizung" value={d.ht} onChange={(v) => u("ht", v)} options={HT} />
                <Field label="Dämmung" value={d.ins} onChange={(v) => u("ins", v)} options={INS} />
                <Field label="Fenster" value={d.win} onChange={(v) => u("win", v)} options={WI} />
              </div>
            </div>

            <div style={{ display: "flex", gap: 0, marginBottom: 10, background: "#fff", borderRadius: 9, overflow: "hidden" }}>
              {[{ id: "value", l: "💰 VALUE", c: "#1a5f3a" }, { id: "risk", l: "⚠️ RISK", c: "#b45309" }, { id: "energy", l: "⚡ ENERGY", c: "#1a4a6a" }].map((t) => (
                <button key={t.id} onClick={() => setTb(t.id)} style={{ flex: 1, padding: "9px", border: "none", borderBottom: tb === t.id ? `3px solid ${t.c}` : "3px solid transparent", background: tb === t.id ? t.c + "08" : "#fff", fontSize: 11, fontWeight: tb === t.id ? 700 : 500, color: tb === t.id ? t.c : "#8a9aaa", cursor: "pointer" }}>{t.l}</button>
              ))}
            </div>

            {tb === "value" && (
              <div>
                <div style={CD}>
                  <div style={{ fontFamily: "'Fraunces',serif", fontSize: 14, fontWeight: 600, color: "#1a5f3a", marginBottom: 6 }}>Gebäudewertermittlung</div>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 6 }}>
                    <Stat l="Wert 1914" v={w.w1914.toLocaleString("de-DE") + " M"} a="#8a6a1a" />
                    <Stat l="NHK 2010" v={(w.w2010 / 1e3).toFixed(0) + "T€"} s={w.nhk + "€/m²"} a="#1a5f3a" />
                    <Stat l="Aktuell" v={(w.wAkt / 1e3).toFixed(0) + "T€"} a="#1a4a6a" />
                    <Stat l="Verkehrswert" v={(val.tot / 1e3).toFixed(0) + "T€"} s={val.ps + "€/m²"} a="#5a3a6a" />
                  </div>
                </div>
                <div style={{ ...CD, borderTop: "3px solid #5a3a6a" }}>
                  <div style={{ fontFamily: "'Fraunces',serif", fontSize: 14, fontWeight: 600, color: "#5a3a6a", marginBottom: 6 }}>Restnutzungsdauer & Sonderabschreibung</div>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
                    <Stat l="Alter" v={rnd.alt + "J"} a="#5a6a7a" />
                    <Stat l="GND" v={rnd.gnd + "J"} a="#5a6a7a" />
                    <Stat l="RND reg." v={rnd.rR + "J"} a="#1a4a6a" />
                    <Stat l="RND wirt." v={rnd.rW + "J"} a={rnd.gV ? "#D32F2F" : "#4CAF50"} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                    <div style={{ padding: "8px 10px", borderRadius: 9, background: "#f8fafc", border: "1px solid #e0e5ea" }}>
                      <div style={{ fontSize: 9, fontWeight: 600, color: "#6a7a8a", textTransform: "uppercase" }}>Reguläre AfA §7(4)</div>
                      <div style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 700, color: "#5a6a7a" }}>{rnd.aN}%</div>
                      <div style={{ fontSize: 10, color: "#6a7a8a" }}>{rnd.aNj.toLocaleString("de-DE")} €/Jahr</div>
                    </div>
                    <div style={{ padding: "8px 10px", borderRadius: 9, background: rnd.gV ? "#fef7f0" : "#f8fafc", border: rnd.gV ? "1.5px solid #e8c090" : "1px solid #e0e5ea" }}>
                      <div style={{ fontSize: 9, fontWeight: 600, color: rnd.gV ? "#8a5a1a" : "#6a7a8a", textTransform: "uppercase" }}>Verkürzte AfA {rnd.gV ? "⭐" : ""}</div>
                      <div style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 700, color: rnd.gV ? "#c75a20" : "#5a6a7a" }}>{rnd.aV}%</div>
                      <div style={{ fontSize: 10, color: rnd.gV ? "#8a5a1a" : "#6a7a8a" }}>{rnd.aVj.toLocaleString("de-DE")} €/Jahr</div>
                    </div>
                  </div>
                  {rnd.gV && (
                    <div style={{ padding: "8px", borderRadius: 8, background: "#fef7f0", border: "1px solid #e8c090", fontSize: 11, color: "#6a4a1a" }}>
                      <strong>⭐ Gutachten lohnt sich!</strong> Mehrabschreibung +{rnd.mehr.toLocaleString("de-DE")} €/a, Steuerersparnis ~{rnd.s35.toLocaleString("de-DE")} €/a (35%)
                    </div>
                  )}
                </div>
                <button onClick={() => genPDF(d, e, w, rnd, ri, sol)} style={{ width: "100%", padding: "9px", borderRadius: 8, border: "none", background: "#1a4a6a", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>📄 PDF GebäudeReport</button>
              </div>
            )}

            {tb === "risk" && (
              <div style={CD}>
                <div style={{ fontFamily: "'Fraunces',serif", fontSize: 14, fontWeight: 600, color: "#b45309", marginBottom: 6 }}>Klimarisiko & ESG-KPIs</div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
                  <Stat l="Score" v={ri.tot} s={ri.lv} a={ri.col} />
                  <Stat l="CRREM" v={esg.crr} a={esg.crr === "On Track" ? "#4CAF50" : "#D32F2F"} />
                  <Stat l="EU-Taxo" v={esg.tax ? "✓" : "✗"} a={esg.tax ? "#4CAF50" : "#D32F2F"} />
                  <Stat l="CO₂" v={e.co2s + " kg"} s="pro m²·a" a="#6a7a4a" />
                </div>
                <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", color: "#5a6a7a", marginBottom: 4 }}>Klimaszenarien SSP/RCP</div>
                <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                  {SSP.map((s) => (
                    <button key={s.id} onClick={() => setSspSel(s.id)} style={{ flex: 1, padding: "5px 4px", borderRadius: 6, border: sspSel === s.id ? `2px solid ${s.col}` : "2px solid #e8edf2", background: sspSel === s.id ? s.col + "10" : "#f8fafc", fontSize: 9, fontWeight: 600, color: sspSel === s.id ? s.col : "#6a7a8a", cursor: "pointer" }}>{s.l}</button>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                  {[{ y: "2030", t: ssp.t30 }, { y: "2050", t: ssp.t50 }, { y: "2080", t: ssp.t80 }].map((p) => (
                    <div key={p.y} style={{ padding: "8px", borderRadius: 8, background: ssp.col + "08", border: `1px solid ${ssp.col}20`, textAlign: "center" }}>
                      <div style={{ fontSize: 9, fontWeight: 600 }}>{p.y}</div>
                      <div style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 700, color: ssp.col }}>+{p.t}°C</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 6, fontSize: 9, color: "#8a9aaa" }}>IPCC AR6 · CSRD/MaRisk-konform · DIN EN ISO 14091</div>
              </div>
            )}

            {tb === "energy" && (
              <div>
                <div style={CD}>
                  <div style={{ fontFamily: "'Fraunces',serif", fontSize: 14, fontWeight: 600, color: "#1a4a6a", marginBottom: 6 }}>DIN V 18599 Energiebewertung</div>
                  <EnergyBar kw={e.eps} />
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 6 }}>
                    <Stat l="Endenergie" v={e.eps} s="kWh/(m²·a)" a={e.ec.col} />
                    <Stat l="Primärenergie" v={e.pps} s="kWh/(m²·a)" a="#4a5a7a" />
                    <Stat l="Klasse" v={e.ec.c} a={e.ec.col} />
                    <Stat l="CO₂" v={e.co2t + "t/a"} a="#6a7a4a" />
                  </div>
                  {e.pfl.map((p, i) => <div key={i} style={{ marginTop: 4, padding: "5px 8px", borderRadius: 6, background: "#eff6ff", border: "1px solid #93c5fd", fontSize: 10.5, color: "#1e40af" }}>🔵 {p}</div>)}
                  <div style={{ marginTop: 6, padding: "6px 8px", borderRadius: 7, background: "#fffbf0", border: "1px solid #f0e8c0" }}>
                    <div style={{ fontSize: 9, fontWeight: 600, color: "#8a6a1a" }}>☀️ Solarpotenzial</div>
                    <div style={{ fontSize: 11 }}>{sol.k} kWp · {sol.kwh.toLocaleString("de-DE")} kWh/a · Ersparnis {sol.eur} €/a</div>
                  </div>
                </div>
                {sc.length > 0 && (
                  <div style={CD}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 5 }}>Sanierung</div>
                    <div style={{ display: "flex", gap: 3, marginBottom: 6 }}>
                      {sc.map((s, i) => (
                        <button key={i} onClick={() => setST(i)} style={{ padding: "4px 9px", borderRadius: 5, border: sT === i ? "2px solid " + (EC.find((c) => c.c === s.cls) || {}).col : "2px solid #e8edf2", fontSize: 11, fontWeight: 600, cursor: "pointer", color: sT === i ? (EC.find((c) => c.c === s.cls) || {}).col : "#6a7a8a" }}>{s.cls}</button>
                      ))}
                    </div>
                    {cS && cS.ms.map((m, i) => (
                      <div key={i} style={{ fontSize: 11, padding: "3px 0", borderBottom: "1px solid #f0f4f8" }}>{i + 1}. {m.n} · <span style={{ color: "#c75a20" }}>{m.c.toLocaleString("de-DE")}€</span> · <span style={{ color: "#2a8f5a" }}>-{Math.round(m.sv)}kWh</span></div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: "flex", gap: 5, marginTop: 4 }}>
              <button onClick={() => go("cert")} style={{ flex: 1, padding: "9px", borderRadius: 8, border: "none", background: brandCol, color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>📄 Energieausweis</button>
              <button onClick={() => go("isfp")} style={{ flex: 1, padding: "9px", borderRadius: 8, border: `2px solid ${brandCol}`, background: "#fff", color: brandCol, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>📋 iSFP</button>
              <button onClick={() => go("foerder")} style={{ flex: 1, padding: "9px", borderRadius: 8, border: "2px solid #1a4a6a", background: "#fff", color: "#1a4a6a", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>💰 Förderung</button>
            </div>
          </div>
        )}

        {vw === "isfp" && us && (
          <div>
            {ISF.map((cat) => (
              <div key={cat.ct} style={{ ...CD, borderLeft: "3px solid " + brandCol }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 5 }}>{cat.ct}</div>
                <div style={g3}>
                  {cat.fs.map((f) => {
                    const val2 = iC[f.id] !== undefined ? iC[f.id] : (f.bi && d[f.bi] ? d[f.bi] : "");
                    return <Field key={f.id} label={f.l} type={f.tp === "select" ? undefined : f.tp} value={val2} onChange={(v) => iSet(f.id, v)} options={f.tp === "select" ? f.op : undefined} />;
                  })}
                </div>
              </div>
            ))}
            <div style={CD}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 5 }}>Live-Ergebnis</div>
              <EnergyBar kw={e.eps} />
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 6 }}>
                <Stat l="Endenergie" v={e.eps} s="kWh/(m²·a)" a={e.ec.col} />
                <Stat l="Klasse" v={e.ec.c} a={e.ec.col} />
                <Stat l="CO₂" v={e.co2t + "t/a"} a="#6a7a4a" />
              </div>
            </div>
            <div style={{ display: "flex", gap: 5 }}>
              <button onClick={() => go("cert")} style={{ flex: 1, padding: "9px", borderRadius: 8, border: "none", background: brandCol, color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>📄 Energieausweis erstellen</button>
            </div>
          </div>
        )}

        {vw === "cert" && us && (
          <div>
            {us.role === "berater" && (
              <div style={{ ...CD, background: "#fef9f0", border: "1px solid #f0e0c0" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  <Field label="Aussteller" type="text" value={cB.name} onChange={(v) => setCB((p) => ({ ...p, name: v }))} placeholder="Dipl.-Ing. Mustermann" />
                  <Field label="Reg.-Nr." type="text" value={cB.regNr} onChange={(v) => setCB((p) => ({ ...p, regNr: v }))} placeholder="EBW-12345" />
                </div>
              </div>
            )}
            <div style={{ ...CD, padding: 0, overflow: "hidden" }}>
              <div style={{ background: "linear-gradient(135deg,#0d2818,#1a4a2e)", padding: "12px 14px", color: "#fff" }}>
                <div style={{ fontSize: 8, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,.3)" }}>ENERGIEBEDARFSAUSWEIS · DIN V 18599 · GEG 2024</div>
                <div style={{ fontFamily: "'Fraunces',serif", fontSize: 15, fontWeight: 700, marginTop: 2 }}>Gebäudeenergiegesetz</div>
                {us.role === "berater" && cB.regNr ? <span style={{ fontSize: 10, background: "#4CAF5030", color: "#4CAF50", padding: "2px 6px", borderRadius: 4 }}>Rechtsgültig · {cB.regNr}</span> : <span style={{ fontSize: 10, background: "#FFC10730", color: "#FFC107", padding: "2px 6px", borderRadius: 4 }}>Entwurf</span>}
              </div>
              <div style={{ padding: 14 }}>
                <EnergyBar kw={e.eps} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, margin: "8px 0" }}>
                  <div style={{ padding: "8px 10px", borderRadius: 8, background: e.ec.col + "0a", border: `1px solid ${e.ec.col}25` }}>
                    <div style={{ fontSize: 8, textTransform: "uppercase", color: "#5a6a7a" }}>Endenergie</div>
                    <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 700, color: e.ec.col }}>{e.eps} <span style={{ fontSize: 10 }}>kWh/(m²·a)</span></div>
                  </div>
                  <div style={{ padding: "8px 10px", borderRadius: 8, background: "#f0f4f8" }}>
                    <div style={{ fontSize: 8, textTransform: "uppercase", color: "#5a6a7a" }}>Primärenergie</div>
                    <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 700, color: "#4a5a7a" }}>{e.pps} <span style={{ fontSize: 10 }}>kWh/(m²·a)</span></div>
                  </div>
                </div>
                <div style={{ fontSize: 10.5 }}>
                  <div>Heizwärme: {e.qH.toLocaleString("de-DE")} kWh/a · CO₂: {e.co2t} t/a · HT': {e.htP} W/(m²K)</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {vw === "foerder" && us && (
          <div style={CD}>
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 14, fontWeight: 600, marginBottom: 6 }}>💰 Fördermittelservice</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
              {FCAT.map((fc) => (
                <label key={fc.id} style={{ display: "flex", gap: 4, alignItems: "center", padding: "4px 8px", borderRadius: 6, border: fS.includes(fc.id) ? `1.5px solid ${brandCol}` : "1.5px solid #e8edf2", background: fS.includes(fc.id) ? "#f0faf5" : "#fafbfc", cursor: "pointer", fontSize: 10.5 }}>
                  <input type="checkbox" checked={fS.includes(fc.id)} onChange={() => setFS((p) => p.includes(fc.id) ? p.filter((x) => x !== fc.id) : [...p, fc.id])} style={{ accentColor: brandCol, width: 13, height: 13 }} />
                  {fc.l}
                </label>
              ))}
            </div>
            {mF.map((f, i) => (
              <div key={i} style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid #d0d8e0", marginBottom: 3, fontSize: 11 }}>
                <strong>{f.nm}</strong> · <span style={{ color: "#1a5f3a", fontWeight: 600 }}>{f.sa}</span> · Max: {f.mx}
              </div>
            ))}
          </div>
        )}

        {vw === "api" && us && (
          <div>
            <div style={{ ...CD, borderTop: "3px solid #1a4a6a" }}>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 15, fontWeight: 600, color: "#1a4a6a", marginBottom: 6 }}>🔌 SaaS API & Whitelabel</div>
              <div style={{ padding: "10px 12px", borderRadius: 9, background: "#0d2818", color: "#4CAF50", marginBottom: 10, fontFamily: "monospace", fontSize: 11 }}>
                <div style={{ marginBottom: 4 }}>// Ihr API-Key</div>
                <div style={{ background: "#1a3a2a", padding: "6px 10px", borderRadius: 6, wordBreak: "break-all", color: "#fff" }}>{userApiKey}</div>
              </div>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", color: "#5a6a7a", marginBottom: 4 }}>Endpunkte</div>
              {[
                { p: "buildings/value", d: "Wert 1914/2010, Kataster, 3D, Luftbild" },
                { p: "buildings/energy", d: "DIN 18599, CO₂, EE-Klasse, CSRD" },
                { p: "climate/risk", d: "ZÜRS, SSP/RCP 2030-2080, ESG" },
                { p: "address/validate", d: "Adressvalidierung, Geocoding" },
                { p: "buildings/3d", d: "3D-Modell, Grundfläche, Volumen" },
                { p: "buildings/aerial", d: "Luftbild, Gebäudeumring" },
                { p: "portfolio/enrich", d: "Batch ESG-KPIs per CSV" },
                { p: "buildings/report", d: "PDF GebäudeReport" },
              ].map((ep) => (
                <div key={ep.p} style={{ padding: "5px 8px", borderRadius: 7, border: "1px solid #e8edf2", marginBottom: 3, display: "flex", justifyContent: "space-between" }}>
                  <div><div style={{ fontFamily: "monospace", fontSize: 10, color: "#1a4a6a", fontWeight: 600 }}>GET /{ep.p}</div><div style={{ fontSize: 9, color: "#8a9aaa" }}>{ep.d}</div></div>
                  <span style={{ fontSize: 9, background: "#1a4a6a15", color: "#1a4a6a", padding: "1px 5px", borderRadius: 3, alignSelf: "center" }}>API</span>
                </div>
              ))}
            </div>
            <div style={{ ...CD, borderTop: "3px solid #5a3a6a" }}>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 15, fontWeight: 600, color: "#5a3a6a", marginBottom: 6 }}>🎨 Whitelabel</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <Field label="Markenname" type="text" value={wlCfg.brand} onChange={(v) => setWlCfg((p) => ({ ...p, brand: v }))} />
                <Field label="Primärfarbe" type="text" value={wlCfg.color} onChange={(v) => setWlCfg((p) => ({ ...p, color: v }))} />
              </div>
              <div style={{ marginTop: 6, fontSize: 9, color: "#8a9aaa" }}>Datenquellen: SkenData API · 61 Mio. 3D-Gebäude · Katasteramtsdaten · ZÜRS · SSP/RCP · DIN V 18599</div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

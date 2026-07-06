const CONFIG = window.POLLA_CONFIG || {};

const countryFlags = {
  "PY": "🇵🇾", "Paraguay": "🇵🇾",
  "FR": "🇫🇷", "Francia": "🇫🇷",
  "CA": "🇨🇦", "Canadá": "🇨🇦", "Canada": "🇨🇦",
  "MA": "🇲🇦", "Marruecos": "🇲🇦",
  "PT": "🇵🇹", "Portugal": "🇵🇹",
  "ES": "🇪🇸", "España": "🇪🇸", "Espana": "🇪🇸",
  "US": "🇺🇸", "Estados Unidos": "🇺🇸",
  "BE": "🇧🇪", "Bélgica": "🇧🇪", "Belgica": "🇧🇪",
  "BR": "🇧🇷", "Brasil": "🇧🇷",
  "NO": "🇳🇴", "Noruega": "🇳🇴",
  "MX": "🇲🇽", "México": "🇲🇽", "Mexico": "🇲🇽",
  "EN": "🏴", "Inglaterra": "🏴",
  "AR": "🇦🇷", "Argentina": "🇦🇷",
  "EG": "🇪🇬", "Egipto": "🇪🇬",
  "CH": "🇨🇭", "Suiza": "🇨🇭",
  "CO": "🇨🇴", "Colombia": "🇨🇴",
  "GH": "🇬🇭", "Ghana": "🇬🇭",
  "JP": "🇯🇵", "Japón": "🇯🇵", "Japon": "🇯🇵",
  "DE": "🇩🇪", "Alemania": "🇩🇪"
};

const codeToCountry = {
  "PY": "Paraguay",
  "FR": "Francia",
  "CA": "Canadá",
  "MA": "Marruecos",
  "PT": "Portugal",
  "ES": "España",
  "US": "Estados Unidos",
  "BE": "Bélgica",
  "BR": "Brasil",
  "NO": "Noruega",
  "MX": "México",
  "EN": "Inglaterra",
  "AR": "Argentina",
  "EG": "Egipto",
  "CH": "Suiza",
  "CO": "Colombia",
  "GH": "Ghana",
  "JP": "Japón",
  "DE": "Alemania"
};

const normalize = (value) => String(value ?? "")
  .replace(/\uFEFF/g, "")
  .replace(/\n/g, " ")
  .replace(/\r/g, " ")
  .trim()
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/\s+/g, " ");

const compact = (value) => normalize(value).replace(/[^a-z0-9]/g, "");

function parseTeam(value) {
  const raw = String(value ?? "").replace(/\uFEFF/g, "").replace(/\s+/g, " ").trim();
  if (!raw) return { code: "", name: "" };

  const parts = raw.split(" ");
  const first = parts[0].replace(/[^A-Za-z]/g, "").toUpperCase();

  if (first.length === 2 && codeToCountry[first]) {
    const remaining = parts.slice(1).join(" ").trim();
    return { code: first, name: remaining || codeToCountry[first] };
  }

  const foundCode = Object.entries(codeToCountry).find(([, country]) => normalize(country) === normalize(raw));
  return { code: foundCode ? foundCode[0] : "", name: raw };
}

function flagForTeam(value) {
  const parsed = parseTeam(value);
  return countryFlags[parsed.code] || countryFlags[parsed.name] || "";
}

function displayTeam(value) {
  const parsed = parseTeam(value);
  if (!parsed.name) return "Por definir";
  const flag = countryFlags[parsed.code] || countryFlags[parsed.name] || "";
  return `${flag ? `<span class="flag">${flag}</span>` : ""}${esc(parsed.name)}`;
}

function displayPlainTeam(value) {
  const parsed = parseTeam(value);
  return parsed.name || "";
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i++;
      row.push(cell);
      if (row.some(v => String(v).trim() !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell);
  if (row.some(v => String(v).trim() !== "")) rows.push(row);
  return rows;
}

function rowsToObjects(rawRows, requiredHeaders = []) {
  if (!rawRows.length) return [];

  let headerIndex = 0;
  if (requiredHeaders.length) {
    headerIndex = rawRows.findIndex(row => {
      const normalizedRow = row.map(compact);
      return requiredHeaders.every(h => normalizedRow.includes(compact(h)));
    });
    if (headerIndex < 0) {
      headerIndex = rawRows.findIndex(row => row.some(cell => requiredHeaders.map(compact).includes(compact(cell))));
    }
  }

  if (headerIndex < 0) headerIndex = 0;

  const headers = rawRows[headerIndex].map(h => String(h).replace(/\n/g, " ").trim());
  return rawRows.slice(headerIndex + 1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = String(row[i] ?? "").trim());
    return obj;
  }).filter(obj => Object.values(obj).some(v => String(v).trim() !== ""));
}

function get(row, aliases) {
  const keys = Object.keys(row || {});
  for (const alias of aliases) {
    const exact = keys.find(k => compact(k) === compact(alias));
    if (exact) return row[exact];
  }
  for (const alias of aliases) {
    const partial = keys.find(k => compact(k).includes(compact(alias)) || compact(alias).includes(compact(k)));
    if (partial) return row[partial];
  }
  return "";
}

function num(value) {
  if (value === null || value === undefined || value === "") return 0;
  const n = Number(String(value).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, m => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[m]));
}

async function fetchSheet(url, label, requiredHeaders) {
  if (!url || url.includes("PEGA_AQUI")) return [];
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`No se pudo cargar ${label}.`);
  const raw = parseCSV(await response.text());
  return rowsToObjects(raw, requiredHeaders);
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

let rankingRows = [];
let resultsRows = [];
let scoresRows = [];
let bonusRows = [];

function denseRank(total, sortedTotals) {
  return sortedTotals.indexOf(total) + 1;
}

function prepareRanking(rows) {
  const filtered = rows.filter(r => get(r, ["Participante", "Nombre"]));
  const sorted = filtered.sort((a, b) => {
    const diff = num(get(b, ["Total"])) - num(get(a, ["Total"]));
    if (diff) return diff;
    return get(a, ["Participante"]).localeCompare(get(b, ["Participante"]));
  });
  const uniqueTotals = [...new Set(sorted.map(r => num(get(r, ["Total"]))))].sort((a, b) => b - a);
  return sorted.map(r => ({ ...r, _rank: denseRank(num(get(r, ["Total"])), uniqueTotals) }));
}

function renderPodium(rows) {
  const grid = document.getElementById("podiumGrid");
  const top = rows.filter(r => r._rank <= 3).slice(0, 3);
  const medals = {1: "🥇", 2: "🥈", 3: "🥉"};
  grid.innerHTML = top.map(row => `
    <article class="podium-card">
      <div class="medal">${medals[row._rank] || "🏅"}</div>
      <strong>${esc(get(row, ["Participante"]))}</strong>
      <small>Puesto ${row._rank} · ${num(get(row, ["Total"]))} pts</small>
      <small>Octavos: ${num(get(row, ["Octavos"]))} · Cuartos: ${num(get(row, ["Cuartos"]))}</small>
    </article>
  `).join("");
}

function renderRanking(rows) {
  const prepared = prepareRanking(rows);
  const tbody = document.querySelector("#rankingTable tbody");
  const select = document.getElementById("participantSelect");

  tbody.innerHTML = "";
  select.innerHTML = `<option value="">Selecciona un participante</option>`;

  prepared.forEach(row => {
    const participant = get(row, ["Participante"]);
    const tr = document.createElement("tr");
    tr.dataset.participant = participant;

    const rankClass = row._rank === 1 ? "top" : row._rank === 2 ? "second" : row._rank === 3 ? "third" : "";
    tr.innerHTML = `
      <td><span class="rank ${rankClass}">${row._rank}</span></td>
      <td>${esc(participant)}</td>
      <td class="num">${num(get(row, ["Octavos"]))}</td>
      <td class="num">${num(get(row, ["Cuartos"]))}</td>
      <td class="num">${num(get(row, ["Semifinal"]))}</td>
      <td class="num">${num(get(row, ["3er y 4to puesto", "3er y 4to"]))}</td>
      <td class="num">${num(get(row, ["Final"]))}</td>
      <td class="num">${num(get(row, ["Bonus"]))}</td>
      <td class="num total">${num(get(row, ["Total"]))}</td>
    `;
    tr.addEventListener("click", () => {
      select.value = participant;
      renderParticipantDetail(participant);
      document.querySelector("#participantDetail").scrollIntoView({ behavior: "smooth", block: "center" });
    });
    tbody.appendChild(tr);

    const opt = document.createElement("option");
    opt.value = participant;
    opt.textContent = participant;
    select.appendChild(opt);
  });

  const leader = prepared[0];
  setText("leaderName", leader ? get(leader, ["Participante"]) : "-");
  setText("leaderPts", leader ? `${num(get(leader, ["Total"]))} pts` : "- pts");
  setText("participantCount", prepared.length);
  renderPodium(prepared);
}

function renderResults(rows) {
  const tbody = document.querySelector("#resultsTable tbody");
  tbody.innerHTML = "";

  const filtered = rows
    .filter(r => num(get(r, ["Orden"])) > 0 && num(get(r, ["Orden"])) <= 16)
    .sort((a, b) => num(get(a, ["Orden"])) - num(get(b, ["Orden"])));

  let played = 0;
  let next = null;

  filtered.forEach(row => {
    const orden = num(get(row, ["Orden"]));
    const ronda = get(row, ["Ronda"]);
    const equipoA = get(row, ["Equipo A Real", "Equipo A", "Local"]);
    const equipoB = get(row, ["Equipo B Real", "Equipo B", "Visitante"]);
    const golesA = get(row, ["Goles A Real", "Goles A"]);
    const golesB = get(row, ["Goles B Real", "Goles B"]);
    const marcador = get(row, ["Marcador real", "Marcador"]) || (golesA !== "" && golesB !== "" ? `${golesA}-${golesB}` : "");
    const clasificado = get(row, ["Clasificado real", "Clasificado"]);
    const estado = get(row, ["Estado"]) || (marcador ? "Completo" : "Pendiente");
    const isComplete = normalize(estado).includes("completo") || (golesA !== "" && golesB !== "" && clasificado);

    if (isComplete) played++;
    if (!isComplete && !next && equipoA && equipoB) next = { equipoA, equipoB, ronda };

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${orden}</td>
      <td>${esc(ronda)}</td>
      <td class="match">${displayTeam(equipoA)} vs ${displayTeam(equipoB)}</td>
      <td>${esc(marcador || "-")}</td>
      <td>${clasificado ? displayTeam(clasificado) : "-"}</td>
      <td><span class="status ${isComplete ? "complete" : "pending"}">${isComplete ? "Completo" : "Pendiente"}</span></td>
    `;
    tbody.appendChild(tr);
  });

  setText("playedCount", played);
  setText("totalMatches", `de ${filtered.length || 16} partidos`);
  setText("nextMatch", next ? `${displayPlainTeam(next.equipoA)} vs ${displayPlainTeam(next.equipoB)}` : "-");
  setText("nextRound", next ? next.ronda : "Sin próximos definidos");
}

function renderParticipantDetail(participant) {
  const container = document.getElementById("participantDetail");
  if (!participant) {
    container.className = "detail-empty";
    container.innerHTML = "Selecciona un participante para ver el detalle.";
    return;
  }

  const rows = scoresRows
    .filter(r => normalize(get(r, ["Participante"])) === normalize(participant))
    .filter(r => num(get(r, ["Orden", "Ord en"])) > 0 && num(get(r, ["Orden", "Ord en"])) <= 16)
    .sort((a, b) => num(get(a, ["Orden", "Ord en"])) - num(get(b, ["Orden", "Ord en"])));

  if (!rows.length) {
    container.className = "detail-empty";
    container.innerHTML = "No hay puntajes detallados para este participante.";
    return;
  }

  container.className = "";
  container.innerHTML = rows.map(row => {
    const orden = num(get(row, ["Orden", "Ord en"]));
    const ronda = get(row, ["Ronda"]);
    const llave = get(row, ["Llave"]);

    const aPron = get(row, ["Equipo A Pron.", "Equipo A Pron"]);
    const bPron = get(row, ["Equipo B Pron.", "Equipo B Pron"]);
    const gaPron = get(row, ["Goles A Pron.", "Goles A Pron"]);
    const gbPron = get(row, ["Goles B Pron.", "Goles B Pron"]);
    const clasPron = get(row, ["Clasificado Pron.", "Clasificado Pron"]);

    const aReal = get(row, ["Equipo A Real"]);
    const bReal = get(row, ["Equipo B Real"]);
    const gaReal = get(row, ["Goles A Real"]);
    const gbReal = get(row, ["Goles B Real"]);
    const resultadoReal = get(row, ["Resultado Real"]);
    const clasReal = get(row, ["Clasificado Real"]);
    const hasRealScore = gaReal !== "" && gbReal !== "";

    const total = num(get(row, ["Total Partido", "Total"]));
    const ptsRes = num(get(row, ["Pts Resultado"]));
    const ptsGoles = num(get(row, ["Pts Goles"]));
    const ptsMarc = num(get(row, ["Pts Marcador"]));

    return `
      <div class="detail-card">
        <strong>
          <span>${orden}. ${esc(ronda)} · ${esc(llave)}</span>
          <span class="badge">${total} pts</span>
        </strong>
        <div>Pronóstico: ${displayTeam(aPron)} ${esc(gaPron || "-")} - ${esc(gbPron || "-")} ${displayTeam(bPron)}</div>
        <div class="detail-meta">Clasificado pronosticado: ${clasPron ? displayTeam(clasPron) : "-"}</div>
        <div class="detail-meta">
          Real: ${displayTeam(aReal)} ${hasRealScore ? esc(gaReal) : "-"} - ${hasRealScore ? esc(gbReal) : "-"} ${displayTeam(bReal)}
        </div>
        <div class="detail-meta">Resultado real: ${resultadoReal ? displayTeam(resultadoReal) : "-"} · Clasificado real: ${clasReal ? displayTeam(clasReal) : "-"}</div>
        <div class="detail-meta">Puntos: Resultado ${ptsRes} · Goles ${ptsGoles} · Marcador ${ptsMarc}</div>
      </div>
    `;
  }).join("");
}

function renderBonus(rows) {
  const tbody = document.querySelector("#bonusTable tbody");
  tbody.innerHTML = "";

  rows.filter(r => get(r, ["Participante"])).forEach(row => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${esc(get(row, ["Participante"]))}</td>
      <td>${displayTeam(get(row, ["Campeón Pron.", "Campeón", "Campeon Pron."]))}</td>
      <td>${displayTeam(get(row, ["Subcampeón Pron.", "Subcampeón", "Subcampeon Pron."]))}</td>
      <td>${displayTeam(get(row, ["3er Puesto Pron.", "3er Puesto"]))}</td>
      <td>${displayTeam(get(row, ["4to Puesto Pron.", "4to Puesto"]))}</td>
      <td>${esc(get(row, ["Goleador Pron.", "Goleador"]))}</td>
      <td class="num total">${num(get(row, ["Total Bonus"]))}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderStats() {
  const stats = [];
  const ranking = prepareRanking(rankingRows);

  if (ranking.length) {
    const topOctavos = [...ranking].sort((a,b)=>num(get(b,["Octavos"]))-num(get(a,["Octavos"])))[0];
    stats.push(["Más puntos en octavos", `${get(topOctavos, ["Participante"])} · ${num(get(topOctavos, ["Octavos"]))} pts`]);
  }

  const exactByPerson = {};
  const resultByPerson = {};
  scoresRows.forEach(r => {
    const p = get(r, ["Participante"]);
    if (!p) return;
    if (num(get(r, ["Pts Marcador"])) > 0) exactByPerson[p] = (exactByPerson[p] || 0) + 1;
    if (num(get(r, ["Pts Resultado"])) > 0) resultByPerson[p] = (resultByPerson[p] || 0) + 1;
  });

  const topExact = Object.entries(exactByPerson).sort((a,b)=>b[1]-a[1])[0];
  const topResult = Object.entries(resultByPerson).sort((a,b)=>b[1]-a[1])[0];

  stats.push(["Marcadores exactos", topExact ? `${topExact[0]} · ${topExact[1]}` : "Aún sin datos"]);
  stats.push(["Resultados acertados", topResult ? `${topResult[0]} · ${topResult[1]}` : "Aún sin datos"]);

  const completed = resultsRows.filter(r => normalize(get(r, ["Estado"])).includes("completo")).length;
  stats.push(["Avance del torneo", `${completed} partidos completos`]);

  document.getElementById("statsGrid").innerHTML = stats.map(([title, value]) => `
    <div class="stat-item">
      <strong>${esc(title)}</strong>
      <span>${esc(value)}</span>
    </div>
  `).join("");
}

function setupSearch() {
  const input = document.getElementById("searchInput");
  input.addEventListener("input", () => {
    const q = normalize(input.value);
    const filtered = rankingRows.filter(r => normalize(get(r, ["Participante"])).includes(q));
    renderRanking(filtered);
  });

  document.getElementById("participantSelect").addEventListener("change", (event) => {
    renderParticipantDetail(event.target.value);
  });
}

function showError(error) {
  document.querySelector("main").innerHTML = `
    <div class="error">
      <strong>Error cargando el dashboard.</strong><br>
      ${esc(error.message)}<br><br>
      Revisa que las hojas publicadas como CSV sigan activas y que config.js tenga los links correctos.
    </div>
  `;
}

async function init() {
  try {
    document.title = CONFIG.title || "Polla Familiar Mundial 2026";

    const [ranking, results, scores, bonus] = await Promise.all([
      fetchSheet(CONFIG.rankingCsvUrl, "Ranking", ["Participante", "Total"]),
      fetchSheet(CONFIG.resultsCsvUrl, "Resultados", ["Orden", "Ronda"]),
      fetchSheet(CONFIG.scoresCsvUrl, "Puntajes", ["Participante", "Ronda"]),
      fetchSheet(CONFIG.bonusCsvUrl, "Puntajes Bonus", ["Participante"])
    ]);

    rankingRows = ranking;
    resultsRows = results;
    scoresRows = scores;
    bonusRows = bonus;

    renderRanking(rankingRows);
    renderResults(resultsRows);
    renderBonus(bonusRows);
    renderStats();
    setupSearch();

    setText("lastUpdated", new Date().toLocaleString("es-PE", {
      dateStyle: "medium",
      timeStyle: "short"
    }));
  } catch (error) {
    showError(error);
  }
}

init();

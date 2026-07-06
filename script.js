const CONFIG = window.POLLA_CONFIG || {};

const normalize = (s) => String(s ?? "")
  .trim()
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/\s+/g, " ");

function parseCSV(text) {
  const rows = [];
  let row = [];
  let value = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && insideQuotes && next === '"') {
      value += '"';
      i++;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && next === "\n") i++;
      row.push(value);
      if (row.some(cell => String(cell).trim() !== "")) rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }

  row.push(value);
  if (row.some(cell => String(cell).trim() !== "")) rows.push(row);

  const headers = rows.shift()?.map(h => String(h).trim()) || [];
  return rows.map(r => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = (r[i] ?? "").trim());
    return obj;
  });
}

function get(row, aliases) {
  const keys = Object.keys(row);
  for (const alias of aliases) {
    const found = keys.find(k => normalize(k) === normalize(alias));
    if (found) return row[found];
  }
  return "";
}

function num(v) {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

async function fetchCSV(url, label) {
  if (!url || url.includes("PEGA_AQUI")) return [];
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`No se pudo cargar ${label}. Revisa que la URL CSV esté publicada.`);
  return parseCSV(await response.text());
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function renderRanking(rows) {
  const tbody = document.querySelector("#rankingTable tbody");
  const select = document.querySelector("#participantSelect");
  tbody.innerHTML = "";
  select.innerHTML = '<option value="">Selecciona un participante</option>';

  const sorted = [...rows].sort((a, b) => {
    const ta = num(get(a, ["Total"]));
    const tb = num(get(b, ["Total"]));
    if (tb !== ta) return tb - ta;
    return String(get(a, ["Participante"])).localeCompare(String(get(b, ["Participante"])));
  });

  const uniqueTotals = [...new Set(sorted.map(r => num(get(r, ["Total"]))))].sort((a,b) => b-a);

  sorted.forEach(row => {
    const total = num(get(row, ["Total"]));
    const denseRank = uniqueTotals.indexOf(total) + 1;
    const participante = get(row, ["Participante", "Nombre"]);

    const tr = document.createElement("tr");
    tr.dataset.participante = participante;
    tr.innerHTML = `
      <td><span class="rank ${denseRank === 1 ? "top" : ""}">${denseRank}</span></td>
      <td>${participante}</td>
      <td class="num">${num(get(row, ["Octavos"]))}</td>
      <td class="num">${num(get(row, ["Cuartos"]))}</td>
      <td class="num">${num(get(row, ["Semifinal"]))}</td>
      <td class="num">${num(get(row, ["3er y 4to puesto", "Tercer puesto", "3er y 4to"]))}</td>
      <td class="num">${num(get(row, ["Final"]))}</td>
      <td class="num">${num(get(row, ["Bonus"]))}</td>
      <td class="num total">${total}</td>
    `;
    tr.addEventListener("click", () => {
      select.value = participante;
      renderParticipantDetail(participante);
      document.querySelector(".detail-panel").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    tbody.appendChild(tr);

    const option = document.createElement("option");
    option.value = participante;
    option.textContent = participante;
    select.appendChild(option);
  });

  const leader = sorted[0];
  setText("leaderName", leader ? get(leader, ["Participante", "Nombre"]) : "-");
  setText("leaderPts", leader ? `${num(get(leader, ["Total"]))} pts` : "- pts");
  setText("participantCount", sorted.length);
}

function renderResults(rows) {
  const tbody = document.querySelector("#resultsTable tbody");
  tbody.innerHTML = "";

  let played = 0;
  let next = null;

  rows
    .sort((a, b) => num(get(a, ["Orden", "#"])) - num(get(b, ["Orden", "#"])))
    .forEach(row => {
      const orden = get(row, ["Orden", "#"]);
      const ronda = get(row, ["Ronda"]);
      const equipoA = get(row, ["Equipo A", "Local", "Equipo_A"]);
      const equipoB = get(row, ["Equipo B", "Visitante", "Equipo_B"]);
      const golesA = get(row, ["Goles A", "Goles_A", "GA"]);
      const golesB = get(row, ["Goles B", "Goles_B", "GB"]);
      const clasificado = get(row, ["Clasificado", "Clasifica", "Ganador"]);
      const hasScore = golesA !== "" && golesB !== "";
      const partido = `${equipoA || "Por definir"} vs ${equipoB || "Por definir"}`;

      if (hasScore) played++;
      if (!hasScore && !next && equipoA && equipoB) next = { partido, ronda };

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${orden}</td>
        <td>${ronda}</td>
        <td>${partido}</td>
        <td>${hasScore ? `${golesA} - ${golesB}` : "-"}</td>
        <td>${clasificado || "-"}</td>
      `;
      tbody.appendChild(tr);
    });

  setText("playedCount", played);
  setText("totalMatches", `de ${rows.length || 16} partidos`);
  setText("nextMatch", next ? next.partido : "-");
  setText("nextRound", next ? next.ronda : "Sin próximos definidos");
}

let scoreRows = [];

function renderParticipantDetail(participante) {
  const container = document.getElementById("participantDetail");
  if (!participante) {
    container.className = "detail-empty";
    container.textContent = "Selecciona un participante para ver su detalle partido por partido.";
    return;
  }

  const rows = scoreRows
    .filter(r => normalize(get(r, ["Participante", "Nombre"])) === normalize(participante))
    .sort((a, b) => num(get(a, ["Orden", "#"])) - num(get(b, ["Orden", "#"])));

  if (!rows.length) {
    container.className = "detail-empty";
    container.textContent = "No hay detalle de puntajes disponible para este participante. Revisa la URL de la hoja Puntajes.";
    return;
  }

  container.className = "";
  container.innerHTML = rows.map(row => {
    const orden = get(row, ["Orden", "#"]);
    const ronda = get(row, ["Ronda"]);
    const partido = get(row, ["Partido"]) || `${get(row, ["Equipo A"])} vs ${get(row, ["Equipo B"])}`;
    const golesA = get(row, ["Goles A", "Goles_A"]);
    const golesB = get(row, ["Goles B", "Goles_B"]);
    const clasificado = get(row, ["Clasificado pronosticado", "Clasificado", "Ganador pronosticado"]);
    const puntos = get(row, ["Puntos", "Total puntos", "Puntaje", "Total"]);
    return `
      <div class="detail-card">
        <strong>${orden}. ${ronda} <span class="badge">${puntos || 0} pts</span></strong>
        <div>${partido}</div>
        <div class="detail-meta">Pronóstico: ${golesA || "-"} - ${golesB || "-"} | Clasificado: ${clasificado || "-"}</div>
      </div>
    `;
  }).join("");
}

function setupSearch(allRows) {
  const input = document.getElementById("searchInput");
  input.addEventListener("input", () => {
    const q = normalize(input.value);
    const filtered = allRows.filter(r => normalize(get(r, ["Participante", "Nombre"])).includes(q));
    renderRanking(filtered);
  });
}

function showError(err) {
  document.querySelector("main").innerHTML = `
    <div class="error">
      <strong>Error cargando el dashboard.</strong><br>
      ${err.message}<br><br>
      Revisa config.js y confirma que las hojas estén publicadas como CSV.
    </div>
  `;
}

async function init() {
  try {
    document.title = CONFIG.title || "Polla Familiar Mundial 2026";
    const [rankingRows, resultsRows, scores] = await Promise.all([
      fetchCSV(CONFIG.rankingCsvUrl, "Ranking"),
      fetchCSV(CONFIG.resultsCsvUrl, "Resultados"),
      fetchCSV(CONFIG.scoresCsvUrl, "Puntajes")
    ]);

    scoreRows = scores || [];

    if (!rankingRows.length) throw new Error("Falta configurar rankingCsvUrl en config.js.");
    if (!resultsRows.length) throw new Error("Falta configurar resultsCsvUrl en config.js.");

    renderRanking(rankingRows);
    renderResults(resultsRows);
    setupSearch(rankingRows);

    document.getElementById("participantSelect").addEventListener("change", (e) => {
      renderParticipantDetail(e.target.value);
    });

    setText("lastUpdated", new Date().toLocaleString("es-PE", {
      dateStyle: "medium",
      timeStyle: "short"
    }));
  } catch (err) {
    showError(err);
  }
}

init();

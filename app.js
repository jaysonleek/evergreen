let records = [];

async function loadCSV() {
  const response = await fetch("evergreen_master.csv");
  const text = await response.text();
  records = parseCSV(text);
  render();
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
  const headers = splitCSVLine(lines[0]);

  return lines.slice(1).map(line => {
    const values = splitCSVLine(line);
    const row = {};
    headers.forEach((h, i) => row[h] = values[i] || "");
    return row;
  });
}

function splitCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

function fullName(row) {
  return [
    row.First_Name,
    row.Middle_Name,
    row.Last_Name
  ].filter(Boolean).join(" ");
}

function render() {
  const q = document.getElementById("searchBox").value.toLowerCase().trim();
  const yearFrom = Number(document.getElementById("yearFrom").value);
  const yearTo = Number(document.getElementById("yearTo").value);

  let filtered = records.filter(row => {
    const text = [
      fullName(row),
      row.Maiden_Name,
      row.Birth_Year,
      row.Death_Year,
      row.Burial_Location_Corrected || row.Burial_Location,
      row.Family_Notes
    ].join(" ").toLowerCase();

    const deathYear = Number(row.Death_Year);

    if (q && !text.includes(q)) return false;
    if (yearFrom && deathYear < yearFrom) return false;
    if (yearTo && deathYear > yearTo) return false;

    return true;
  });

  document.getElementById("count").textContent =
    `${filtered.length.toLocaleString()} records shown`;

  const results = document.getElementById("results");
  results.innerHTML = "";

  filtered.slice(0, 200).forEach(row => {
    const card = document.createElement("article");
    card.className = "card";

    card.innerHTML = `
      <h2>${escapeHTML(fullName(row))}</h2>

      <div class="meta">
        <div><strong>Birth:</strong> ${dateText(row.Birth_Day, row.Birth_Month_Clean, row.Birth_Year)}</div>
        <div><strong>Death:</strong> ${dateText(row.Death_Day, row.Death_Month_Clean, row.Death_Year)}</div>
        <div><strong>Burial #:</strong> ${escapeHTML(row.Burial_Number || "")}</div>
        <div><strong>Location:</strong> ${escapeHTML(row.Burial_Location_Corrected || row.Burial_Location || "")}</div>
      </div>

      ${row.Family_Notes ? `<div class="notes"><strong>Family notes:</strong> ${escapeHTML(row.Family_Notes)}</div>` : ""}

      <div>
        ${flag(row.Location_Status)}
        ${flag(row.Date_Logic_Status)}
        ${flag(row.Death_Year_Range_Status)}
      </div>
    `;

    results.appendChild(card);
  });

  if (filtered.length > 200) {
    const more = document.createElement("p");
    more.textContent = "Showing first 200 results. Use search or year filters to narrow the list.";
    results.appendChild(more);
  }
}

function dateText(day, month, year) {
  return [month, day, year].filter(Boolean).join(" ");
}

function flag(value) {
  if (!value || value === "ok" || value === "in_sheet_range_or_missing") {
    return "";
  }

  return `<span class="flag">${escapeHTML(value)}</span>`;
}

function escapeHTML(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

document.getElementById("searchBox").addEventListener("input", render);
document.getElementById("yearFrom").addEventListener("input", render);
document.getElementById("yearTo").addEventListener("input", render);

document.getElementById("clearBtn").addEventListener("click", () => {
  document.getElementById("searchBox").value = "";
  document.getElementById("yearFrom").value = "";
  document.getElementById("yearTo").value = "";
  render();
});

loadCSV();
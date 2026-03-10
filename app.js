const state = {
  raw: [],
  filtered: []
};

const els = {
  search: document.getElementById("search"),
  vehicleType: document.getElementById("vehicleType"),
  fuel: document.getElementById("fuel"),
  transmission: document.getElementById("transmission"),
  seller: document.getElementById("seller"),
  owner: document.getElementById("owner"),
  yearMin: document.getElementById("yearMin"),
  yearMax: document.getElementById("yearMax"),
  reset: document.getElementById("reset"),
  kpiTotalCars: document.getElementById("kpiTotalCars"),
  kpiAvgSelling: document.getElementById("kpiAvgSelling"),
  kpiTotalSelling: document.getElementById("kpiTotalSelling"),
  kpiAvgKms: document.getElementById("kpiAvgKms"),
  fuelChart: document.getElementById("fuelChart"),
  yearChart: document.getElementById("yearChart"),
  scatterChart: document.getElementById("scatterChart"),
  fuelAvgChart: document.getElementById("fuelAvgChart"),
  sellerAvgChart: document.getElementById("sellerAvgChart"),
  tableBody: document.getElementById("tableBody"),
  tableCount: document.getElementById("tableCount"),
  columnToggles: document.getElementById("columnToggles"),
  tableHeaders: document.querySelectorAll("thead th"),
  highlightMode: document.querySelectorAll("input[name=\"highlightMode\"]"),
  clearHighlight: document.getElementById("clearHighlight"),
  exportCsv: document.getElementById("exportCsv"),
  comparePanel: document.getElementById("comparePanel"),
  clearCompare: document.getElementById("clearCompare"),
  pageSize: document.getElementById("pageSize"),
  prevPage: document.getElementById("prevPage"),
  nextPage: document.getElementById("nextPage"),
  pageInfo: document.getElementById("pageInfo"),
  lastUpdated: document.getElementById("lastUpdated")
};

const numberFormat = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 2
});

const currencyFormat = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 2
});

const columns = [
  { key: "carName", label: "Car Name", type: "string" },
  { key: "year", label: "Year", type: "number" },
  { key: "sellingPrice", label: "Selling Price", type: "number" },
  { key: "presentPrice", label: "Present Price", type: "number" },
  { key: "kmsDriven", label: "Kms Driven", type: "number" },
  { key: "fuelType", label: "Fuel", type: "string" },
  { key: "sellerType", label: "Seller", type: "string" },
  { key: "transmission", label: "Transmission", type: "string" },
  { key: "owner", label: "Owner", type: "number" }
];

const visibleColumns = new Set(columns.map(col => col.key));
let highlightMode = "row";
let sortKey = null;
let sortDir = "asc";
let currentPage = 1;
let pageSize = 25;
const compareMap = new Map();
const maxCompare = 4;

const bikeNames = new Set([
  "Activa 3g",
  "Activa 4g",
  "Bajaj  ct 100",
  "Bajaj Avenger 150",
  "Bajaj Avenger 150 street",
  "Bajaj Avenger 220",
  "Bajaj Avenger 220 dtsi",
  "Bajaj Avenger Street 220",
  "Bajaj Discover 100",
  "Bajaj Discover 125",
  "Bajaj Dominar 400",
  "Bajaj Pulsar  NS 200",
  "Bajaj Pulsar 135 LS",
  "Bajaj Pulsar 150",
  "Bajaj Pulsar 220 F",
  "Bajaj Pulsar NS 200",
  "Bajaj Pulsar RS200",
  "Hero  CBZ Xtreme",
  "Hero  Ignitor Disc",
  "Hero Extreme",
  "Hero Glamour",
  "Hero Honda CBZ extreme",
  "Hero Honda Passion Pro",
  "Hero Hunk",
  "Hero Passion Pro",
  "Hero Passion X pro",
  "Hero Splender Plus",
  "Hero Splender iSmart",
  "Hero Super Splendor",
  "Honda Activa 125",
  "Honda Activa 4G",
  "Honda CB Hornet 160R",
  "Honda CB Shine",
  "Honda CB Trigger",
  "Honda CB Unicorn",
  "Honda CB twister",
  "Honda CBR 150",
  "Honda Dream Yuga ",
  "Honda Karizma",
  "KTM 390 Duke ",
  "KTM RC200",
  "KTM RC390",
  "Royal Enfield Bullet 350",
  "Royal Enfield Classic 350",
  "Royal Enfield Classic 500",
  "Royal Enfield Thunder 350",
  "Royal Enfield Thunder 500",
  "Suzuki Access 125",
  "TVS Apache RTR 160",
  "TVS Apache RTR 180",
  "TVS Jupyter",
  "TVS Sport ",
  "TVS Wego",
  "Yamaha FZ  v 2.0",
  "Yamaha FZ 16",
  "Yamaha FZ S ",
  "Yamaha FZ S V 2.0",
  "Yamaha Fazer "
]);

function getVehicleType(name) {
  return bikeNames.has(name) ? "Bike" : "Car";
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines.shift().split(",").map(h => h.trim());
  return lines.map((line, index) => {
    const values = line.split(",");
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] ? values[idx].trim() : "";
    });
    return {
      id: index + 1,
      carName: row.Car_Name,
      year: Number(row.Year),
      sellingPrice: Number(row.Selling_Price),
      presentPrice: Number(row.Present_Price),
      kmsDriven: Number(row.Kms_Driven),
      fuelType: row.Fuel_Type,
      sellerType: row.Seller_Type,
      transmission: row.Transmission,
      owner: Number(row.Owner),
      vehicleType: getVehicleType(row.Car_Name)
    };
  });
}

function uniqueValues(data, key) {
  return Array.from(new Set(data.map(item => item[key]))).filter(Boolean).sort();
}

function populateSelect(select, values) {
  values.forEach(value => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
}

function applyFilters() {
  const search = els.search.value.trim().toLowerCase();
  const vehicleType = els.vehicleType.value;
  const fuel = els.fuel.value;
  const transmission = els.transmission.value;
  const seller = els.seller.value;
  const owner = els.owner.value;
  const yearMin = Number(els.yearMin.value);
  const yearMax = Number(els.yearMax.value);

  state.filtered = state.raw.filter(item => {
    if (search && !item.carName.toLowerCase().includes(search)) return false;
    if (vehicleType !== "all" && item.vehicleType !== vehicleType) return false;
    if (fuel !== "all" && item.fuelType !== fuel) return false;
    if (transmission !== "all" && item.transmission !== transmission) return false;
    if (seller !== "all" && item.sellerType !== seller) return false;
    if (owner !== "all" && item.owner !== Number(owner)) return false;
    if (item.year < yearMin || item.year > yearMax) return false;
    return true;
  });

  updateKPIs();
  currentPage = 1;
  updateTableView();
  renderCharts();
}

function updateKPIs() {
  const total = state.filtered.length;
  const sumSelling = state.filtered.reduce((acc, item) => acc + item.sellingPrice, 0);
  const sumKms = state.filtered.reduce((acc, item) => acc + item.kmsDriven, 0);

  els.kpiTotalCars.textContent = numberFormat.format(total);
  els.kpiAvgSelling.textContent = total ? currencyFormat.format(sumSelling / total) : "0";
  els.kpiTotalSelling.textContent = currencyFormat.format(sumSelling);
  els.kpiAvgKms.textContent = total ? numberFormat.format(sumKms / total) : "0";
}

function renderTable(data) {
  els.tableBody.innerHTML = "";
  data.forEach(item => {
    const checked = compareMap.has(item.id) ? "checked" : "";
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="compare-col">
        <input type="checkbox" class="form-check-input compare-check" data-id="${item.id}" ${checked}>
      </td>
      <td data-col="carName">${item.carName}</td>
      <td data-col="year">${item.year}</td>
      <td data-col="sellingPrice">${currencyFormat.format(item.sellingPrice)}</td>
      <td data-col="presentPrice">${currencyFormat.format(item.presentPrice)}</td>
      <td data-col="kmsDriven">${numberFormat.format(item.kmsDriven)}</td>
      <td data-col="fuelType">${item.fuelType}</td>
      <td data-col="sellerType">${item.sellerType}</td>
      <td data-col="transmission">${item.transmission}</td>
      <td data-col="owner">${item.owner}</td>
    `;
    els.tableBody.appendChild(row);
  });
  els.tableCount.textContent = `${state.filtered.length} rows`;
  applyColumnVisibility();
}

function getSortedData(data) {
  if (!sortKey) return [...data];
  const col = columns.find(c => c.key === sortKey);
  const dir = sortDir === "asc" ? 1 : -1;
  return [...data].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    if (col && col.type === "number") {
      return (av - bv) * dir;
    }
    return String(av).localeCompare(String(bv)) * dir;
  });
}

function getPagedData(data) {
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  if (currentPage > totalPages) currentPage = totalPages;
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  return {
    totalPages,
    pageData: data.slice(start, end),
    start,
    end: Math.min(end, data.length)
  };
}

function updatePaginationControls(totalPages, start, end, total) {
  els.prevPage.disabled = currentPage <= 1;
  els.nextPage.disabled = currentPage >= totalPages;
  if (total === 0) {
    els.pageInfo.textContent = "Page 1 of 1";
  } else {
    els.pageInfo.textContent = `Page ${currentPage} of ${totalPages} (Showing ${start + 1}-${end})`;
  }
}

function updateSortIndicators() {
  document.querySelectorAll("th.sortable").forEach(th => {
    th.classList.remove("sorted-asc", "sorted-desc");
    const key = th.getAttribute("data-col");
    if (key === sortKey) {
      th.classList.add(sortDir === "asc" ? "sorted-asc" : "sorted-desc");
    }
  });
}

function updateTableView() {
  const sorted = getSortedData(state.filtered);
  const { totalPages, pageData, start, end } = getPagedData(sorted);
  renderTable(pageData);
  updatePaginationControls(totalPages, start, end, sorted.length);
  updateSortIndicators();
}

function renderCompare() {
  els.comparePanel.innerHTML = "";
  if (compareMap.size === 0) {
    const empty = document.createElement("div");
    empty.className = "text-muted small";
    empty.textContent = "No vehicles selected.";
    els.comparePanel.appendChild(empty);
    return;
  }

  Array.from(compareMap.values()).forEach(item => {
    const col = document.createElement("div");
    col.className = "col-12 col-md-6 col-lg-3";
    col.innerHTML = `
      <div class="compare-card">
        <div class="compare-title">${item.carName}</div>
        <div class="compare-meta">${item.year} • ${item.fuelType} • ${item.transmission}</div>
        <div class="compare-grid mt-2">
          <div>SELLING:</div><div>${currencyFormat.format(item.sellingPrice)}</div>
          <div>PRESENT:</div><div>${currencyFormat.format(item.presentPrice)}</div>
          <div>KMS:</div><div>${numberFormat.format(item.kmsDriven)}</div>
          <div>SELLER:</div><div>${item.sellerType}</div>
          <div>OWNER:</div><div>${item.owner}</div>
        </div>
      </div>
    `;
    els.comparePanel.appendChild(col);
  });
}

function resizeCanvas(canvas) {
  const parent = canvas.parentElement;
  const width = parent.clientWidth - 16;
  canvas.width = width;
}

function drawBarChart(canvas, labels, values, color) {
  resizeCanvas(canvas);
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  const padding = 34;
  const maxValue = Math.max(...values, 1);
  const barWidth = (width - padding * 2) / values.length - 10;

  ctx.strokeStyle = "rgba(0,0,0,0.15)";
  ctx.beginPath();
  ctx.moveTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.stroke();

  values.forEach((value, idx) => {
    const x = padding + idx * (barWidth + 10);
    const barHeight = ((height - padding * 2) * value) / maxValue;
    ctx.fillStyle = color;
    ctx.fillRect(x, height - padding - barHeight, barWidth, barHeight);
    ctx.fillStyle = "#111827";
    ctx.font = "13px \"Archivo\", \"Segoe UI\", sans-serif";
    ctx.fillText(labels[idx], x, height - padding + 18);
  });
}

function drawLineChart(canvas, labels, values, color) {
  resizeCanvas(canvas);
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  const padding = 34;
  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);
  const range = maxValue - minValue || 1;
  const stepX = (width - padding * 2) / (values.length - 1 || 1);

  ctx.strokeStyle = "rgba(0,0,0,0.15)";
  ctx.beginPath();
  ctx.moveTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.stroke();

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  values.forEach((value, idx) => {
    const x = padding + idx * stepX;
    const y = height - padding - ((value - minValue) / range) * (height - padding * 2);
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  values.forEach((value, idx) => {
    const x = padding + idx * stepX;
    const y = height - padding - ((value - minValue) / range) * (height - padding * 2);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#111827";
    ctx.font = "13px \"Archivo\", \"Segoe UI\", sans-serif";
    ctx.fillText(labels[idx], x - 10, height - padding + 18);
  });
}

function drawScatterChart(canvas, points, color) {
  resizeCanvas(canvas);
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  const padding = 34;
  const xVals = points.map(p => p.x);
  const yVals = points.map(p => p.y);
  const xMin = Math.min(...xVals, 0);
  const xMax = Math.max(...xVals, 1);
  const yMin = Math.min(...yVals, 0);
  const yMax = Math.max(...yVals, 1);
  const xRange = xMax - xMin || 1;
  const yRange = yMax - yMin || 1;

  ctx.strokeStyle = "rgba(0,0,0,0.15)";
  ctx.beginPath();
  ctx.moveTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(padding, height - padding);
  ctx.lineTo(padding, padding);
  ctx.stroke();

  ctx.fillStyle = color;
  points.forEach(p => {
    const x = padding + ((p.x - xMin) / xRange) * (width - padding * 2);
    const y = height - padding - ((p.y - yMin) / yRange) * (height - padding * 2);
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = "#111827";
  ctx.font = "12px \"Archivo\", \"Segoe UI\", sans-serif";
  ctx.fillText("Kms Driven", width / 2 - 30, height - 8);
  ctx.save();
  ctx.translate(12, height / 2 + 30);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("Selling Price", 0, 0);
  ctx.restore();
}

function renderCharts() {
  const fuelCounts = {};
  state.filtered.forEach(item => {
    fuelCounts[item.fuelType] = (fuelCounts[item.fuelType] || 0) + 1;
  });
  const fuelLabels = Object.keys(fuelCounts);
  const fuelValues = fuelLabels.map(label => fuelCounts[label]);
  drawBarChart(els.fuelChart, fuelLabels, fuelValues, "#2563eb");

  const yearGroups = {};
  state.filtered.forEach(item => {
    if (!yearGroups[item.year]) {
      yearGroups[item.year] = { total: 0, count: 0 };
    }
    yearGroups[item.year].total += item.sellingPrice;
    yearGroups[item.year].count += 1;
  });
  const years = Object.keys(yearGroups).map(Number).sort((a, b) => a - b);
  const avgSelling = years.map(year => yearGroups[year].total / yearGroups[year].count);
  const yearLabels = years.map(year => String(year));
  drawLineChart(els.yearChart, yearLabels, avgSelling, "#16a34a");

  const points = state.filtered.map(item => ({
    x: item.kmsDriven,
    y: item.sellingPrice
  }));
  drawScatterChart(els.scatterChart, points, "#0ea5e9");

  const fuelAvg = {};
  state.filtered.forEach(item => {
    if (!fuelAvg[item.fuelType]) fuelAvg[item.fuelType] = { total: 0, count: 0 };
    fuelAvg[item.fuelType].total += item.sellingPrice;
    fuelAvg[item.fuelType].count += 1;
  });
  const fuelAvgLabels = Object.keys(fuelAvg);
  const fuelAvgValues = fuelAvgLabels.map(key => fuelAvg[key].total / fuelAvg[key].count);
  drawBarChart(els.fuelAvgChart, fuelAvgLabels, fuelAvgValues, "#8b5cf6");

  const sellerAvg = {};
  state.filtered.forEach(item => {
    if (!sellerAvg[item.sellerType]) sellerAvg[item.sellerType] = { total: 0, count: 0 };
    sellerAvg[item.sellerType].total += item.sellingPrice;
    sellerAvg[item.sellerType].count += 1;
  });
  const sellerAvgLabels = Object.keys(sellerAvg);
  const sellerAvgValues = sellerAvgLabels.map(key => sellerAvg[key].total / sellerAvg[key].count);
  drawBarChart(els.sellerAvgChart, sellerAvgLabels, sellerAvgValues, "#f97316");
}

function setYearRange(data) {
  const years = data.map(item => item.year);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  els.yearMin.value = minYear;
  els.yearMax.value = maxYear;
  els.yearMin.min = minYear;
  els.yearMin.max = maxYear;
  els.yearMax.min = minYear;
  els.yearMax.max = maxYear;
}

function attachListeners() {
  [
    els.search,
    els.vehicleType,
    els.fuel,
    els.transmission,
    els.seller,
    els.owner,
    els.yearMin,
    els.yearMax
  ].forEach(control => {
    control.addEventListener("input", applyFilters);
    control.addEventListener("change", applyFilters);
  });

  els.reset.addEventListener("click", () => {
    els.search.value = "";
    els.vehicleType.value = "all";
    els.fuel.value = "all";
    els.transmission.value = "all";
    els.seller.value = "all";
    els.owner.value = "all";
    setYearRange(state.raw);
    applyFilters();
  });

  window.addEventListener("resize", () => {
    renderCharts();
  });

  els.pageSize.addEventListener("change", () => {
    pageSize = Number(els.pageSize.value);
    currentPage = 1;
    updateTableView();
  });

  els.prevPage.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage -= 1;
      updateTableView();
    }
  });

  els.nextPage.addEventListener("click", () => {
    currentPage += 1;
    updateTableView();
  });

  els.clearCompare.addEventListener("click", () => {
    compareMap.clear();
    renderCompare();
    updateTableView();
  });
}

function clearHighlights() {
  document.querySelectorAll("tr.highlight-row").forEach(row => row.classList.remove("highlight-row"));
  document.querySelectorAll(".highlight-col").forEach(cell => cell.classList.remove("highlight-col"));
}

function applyColumnHighlight(colKey) {
  document.querySelectorAll(".highlight-col").forEach(cell => cell.classList.remove("highlight-col"));
  const headers = document.querySelectorAll(`th[data-col="${colKey}"]`);
  const cells = document.querySelectorAll(`td[data-col="${colKey}"]`);
  headers.forEach(cell => cell.classList.add("highlight-col"));
  cells.forEach(cell => cell.classList.add("highlight-col"));
}

function buildColumnToggles() {
  els.columnToggles.innerHTML = "";
  columns.forEach(col => {
    const wrapper = document.createElement("div");
    wrapper.className = "col-6 col-md-4 col-lg-3";
    wrapper.innerHTML = `
      <div class="form-check">
        <input class="form-check-input" type="checkbox" data-col="${col.key}" checked />
        <label class="form-check-label">${col.label}</label>
      </div>
    `;
    els.columnToggles.appendChild(wrapper);
  });

  els.columnToggles.addEventListener("change", event => {
    const target = event.target;
    if (target && target.matches("input[type=\"checkbox\"][data-col]")) {
      const key = target.getAttribute("data-col");
      if (target.checked) visibleColumns.add(key);
      else visibleColumns.delete(key);
      applyColumnVisibility();
    }
  });
}

function applyColumnVisibility() {
  const headers = document.querySelectorAll("th[data-col]");
  headers.forEach(th => {
    const key = th.getAttribute("data-col");
    th.classList.toggle("hidden-col", !visibleColumns.has(key));
  });

  const cells = document.querySelectorAll("td[data-col]");
  cells.forEach(td => {
    const key = td.getAttribute("data-col");
    td.classList.toggle("hidden-col", !visibleColumns.has(key));
  });
}

function escapeCSV(value) {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, "\"\"")}"`;
  }
  return str;
}

function exportFilteredCSV() {
  const sorted = getSortedData(state.filtered);
  const selectedColumns = columns.filter(col => visibleColumns.has(col.key));
  const header = selectedColumns.map(col => escapeCSV(col.label)).join(",");
  const rows = sorted.map(item => {
    return selectedColumns.map(col => escapeCSV(item[col.key])).join(",");
  });
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "car_sales_filtered.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function loadData() {
  const response = await fetch("car%20data.csv");
  const text = await response.text();
  state.raw = parseCSV(text);
  state.filtered = [...state.raw];

  populateSelect(els.fuel, uniqueValues(state.raw, "fuelType"));
  populateSelect(els.transmission, uniqueValues(state.raw, "transmission"));
  populateSelect(els.seller, uniqueValues(state.raw, "sellerType"));
  populateSelect(els.owner, uniqueValues(state.raw, "owner"));

  pageSize = Number(els.pageSize.value);
  setYearRange(state.raw);
  updateKPIs();
  updateTableView();
  renderCharts();
  buildColumnToggles();
  applyColumnVisibility();
  attachListeners();
  renderCompare();

  els.highlightMode.forEach(radio => {
    radio.addEventListener("change", event => {
      highlightMode = event.target.value;
      if (highlightMode === "off") clearHighlights();
    });
  });

  els.clearHighlight.addEventListener("click", () => {
    clearHighlights();
  });

  els.tableBody.addEventListener("click", event => {
    if (highlightMode !== "row") return;
    const row = event.target.closest("tr");
    if (!row) return;
    document.querySelectorAll("tr.highlight-row").forEach(r => r.classList.remove("highlight-row"));
    row.classList.add("highlight-row");
  });

  els.tableBody.addEventListener("change", event => {
    const target = event.target;
    if (!target.classList.contains("compare-check")) return;
    const id = Number(target.getAttribute("data-id"));
    const item = state.filtered.find(row => row.id === id) || state.raw.find(row => row.id === id);
    if (!item) return;
    if (target.checked) {
      if (compareMap.size >= maxCompare) {
        target.checked = false;
        alert(`You can compare up to ${maxCompare} vehicles.`);
        return;
      }
      compareMap.set(id, item);
    } else {
      compareMap.delete(id);
    }
    renderCompare();
  });

  document.querySelector("thead").addEventListener("click", event => {
    const th = event.target.closest("th[data-col]");
    if (!th) return;
    const key = th.getAttribute("data-col");
    if (highlightMode === "column") {
      applyColumnHighlight(key);
      return;
    }
    if (sortKey === key) {
      sortDir = sortDir === "asc" ? "desc" : "asc";
    } else {
      sortKey = key;
      sortDir = "asc";
    }
    updateTableView();
  });

  els.exportCsv.addEventListener("click", () => {
    exportFilteredCSV();
  });

  const now = new Date();
  els.lastUpdated.textContent = `Loaded: ${now.toLocaleString()}`;
}

loadData().catch(error => {
  console.error(error);
  els.lastUpdated.textContent = "Failed to load data";
});

import { getState } from "./storage.js";
import { formatTime } from "./utils.js";

let ChartClass = null;
let trendChart = null;
let histogramChart = null;
let chartsReady = false;
let pendingRender = false;

const trendCanvas = () => document.getElementById("chart-trend");
const histogramCanvas = () => document.getElementById("chart-histogram");
const fallbackMessage = () => document.getElementById("chart-fallback");

const loadChartModule = async () => {
  if (ChartClass) {
    return ChartClass;
  }

  try {
    const module = await import("chart.js/auto");
    ChartClass = module.default ?? module.Chart;
    return ChartClass;
  } catch (error) {
    console.warn("Charts unavailable without Chart.js.", error);
    return null;
  }
};

const applyPenalty = (solve) => {
  if (solve.penalty === "dnf") {
    return null;
  }

  const base = solve.timeMs ?? 0;
  return solve.penalty === "plus2" ? base + 2000 : base;
};

const getActiveSolves = () => {
  const { solves, settings } = getState();
  const activeCube = settings.cubeType ?? "3x3";
  const activeSession = settings.sessionId;
  return solves.filter(
    (solve) =>
      (solve.cubeType ?? "3x3") === activeCube &&
      solve.sessionId === activeSession
  );
};

const getChartColors = () => {
  const styles = getComputedStyle(document.documentElement);
  return {
    text: styles.getPropertyValue("--color-text").trim() || "#ffffff",
    muted: styles.getPropertyValue("--color-muted").trim() || "#a0a0a0",
    border: styles.getPropertyValue("--color-border").trim() || "#ffffff",
    panel: styles.getPropertyValue("--color-panel-bg-soft").trim() || "rgba(0, 0, 0, 0.2)",
  };
};

const buildTrendData = (solves) => {
  const chronological = solves.slice().reverse();
  const labels = chronological.map((_, index) => `${index + 1}`);
  const data = chronological.map((solve) => {
    const value = applyPenalty(solve);
    return value === null ? null : value / 1000;
  });

  return { labels, data };
};

const buildHistogramData = (solves) => {
  const numeric = solves
    .map((solve) => applyPenalty(solve))
    .filter((value) => value !== null)
    .map((value) => value / 1000);

  if (!numeric.length) {
    return { labels: [], data: [] };
  }

  const min = Math.min(...numeric);
  const max = Math.max(...numeric);
  const binCount = Math.min(10, Math.max(5, Math.ceil(Math.sqrt(numeric.length))));
  const range = Math.max(0.5, max - min);
  const binSize = range / binCount;
  const bins = new Array(binCount).fill(0);

  numeric.forEach((value) => {
    const index = Math.min(binCount - 1, Math.floor((value - min) / binSize));
    bins[index] += 1;
  });

  const labels = bins.map((_, index) => {
    const start = min + index * binSize;
    const end = start + binSize;
    return `${formatTime(start * 1000, 2)}–${formatTime(end * 1000, 2)}`;
  });

  return { labels, data: bins };
};

const updateChartTheme = (chart) => {
  const colors = getChartColors();
  chart.options.scales.x.ticks.color = colors.muted;
  chart.options.scales.y.ticks.color = colors.muted;
  chart.options.scales.x.grid.color = `${colors.border}33`;
  chart.options.scales.y.grid.color = `${colors.border}33`;
  chart.options.plugins.legend.labels.color = colors.text;
  chart.data.datasets.forEach((dataset) => {
    dataset.borderColor = colors.text;
    dataset.backgroundColor = colors.panel;
    dataset.pointBackgroundColor = colors.text;
  });
};

const createTrendChart = (ctx, data, precision) => {
  const colors = getChartColors();
  return new ChartClass(ctx, {
    type: "line",
    data: {
      labels: data.labels,
      datasets: [
        {
          label: "Solve time (s)",
          data: data.data,
          borderColor: colors.text,
          backgroundColor: colors.panel,
          tension: 0.25,
          pointRadius: 3,
          pointHoverRadius: 4,
          pointBackgroundColor: colors.text,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false, labels: { color: colors.text } },
      },
      scales: {
        x: {
          ticks: { color: colors.muted },
          grid: { color: `${colors.border}33` },
        },
        y: {
          ticks: {
            color: colors.muted,
            callback: (value) => formatTime(value * 1000, precision),
          },
          grid: { color: `${colors.border}33` },
        },
      },
    },
  });
};

const createHistogramChart = (ctx, data) => {
  const colors = getChartColors();
  return new ChartClass(ctx, {
    type: "bar",
    data: {
      labels: data.labels,
      datasets: [
        {
          label: "Solve count",
          data: data.data,
          borderColor: colors.text,
          backgroundColor: colors.panel,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false, labels: { color: colors.text } },
      },
      scales: {
        x: {
          ticks: { color: colors.muted, maxRotation: 0, autoSkip: true },
          grid: { color: `${colors.border}33` },
        },
        y: {
          ticks: { color: colors.muted, precision: 0 },
          grid: { color: `${colors.border}33` },
        },
      },
    },
  });
};

export const renderCharts = () => {
  if (!chartsReady) {
    pendingRender = true;
    return;
  }

  const solves = getActiveSolves();
  const precision = getState().settings.precision;
  const trendData = buildTrendData(solves);
  const histogramData = buildHistogramData(solves);

  if (trendChart) {
    trendChart.data.labels = trendData.labels;
    trendChart.data.datasets[0].data = trendData.data;
    updateChartTheme(trendChart);
    trendChart.options.scales.y.ticks.callback = (value) =>
      formatTime(value * 1000, precision);
    trendChart.update();
  }

  if (histogramChart) {
    histogramChart.data.labels = histogramData.labels;
    histogramChart.data.datasets[0].data = histogramData.data;
    updateChartTheme(histogramChart);
    histogramChart.update();
  }
};

export const initCharts = async () => {
  const fallback = fallbackMessage();
  const Trend = trendCanvas();
  const Histogram = histogramCanvas();

  if (!Trend || !Histogram) {
    return;
  }

  const ChartLib = await loadChartModule();
  if (!ChartLib) {
    if (fallback) {
      fallback.classList.remove("hide");
    }
    return;
  }

  chartsReady = true;
  if (fallback) {
    fallback.classList.add("hide");
  }

  trendChart = createTrendChart(Trend.getContext("2d"), buildTrendData(getActiveSolves()), getState().settings.precision);
  histogramChart = createHistogramChart(
    Histogram.getContext("2d"),
    buildHistogramData(getActiveSolves())
  );

  if (pendingRender) {
    pendingRender = false;
    renderCharts();
  }
};

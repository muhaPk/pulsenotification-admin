import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

const chartColors = ["#465FFF", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

interface TradePoint {
  time: number;
  price: number;
}

export function EquityCurveChart({
  data,
  buyPoints,
  sellPoints,
}: {
  data: { time: number; value: number }[];
  buyPoints?: TradePoint[];
  sellPoints?: TradePoint[];
}) {
  const series: any[] = [
    {
      name: "Equity",
      type: "line",
      data: data.map((d) => [d.time, d.value]),
    },
  ];

  if (buyPoints && buyPoints.length > 0) {
    series.push({
      name: "Long",
      type: "scatter",
      data: buyPoints.map((p) => [p.time, p.price]),
    });
  }

  if (sellPoints && sellPoints.length > 0) {
    series.push({
      name: "Short",
      type: "scatter",
      data: sellPoints.map((p) => [p.time, p.price]),
    });
  }

  const options: ApexOptions = {
    colors: [chartColors[0], chartColors[1], chartColors[3]],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "line",
      toolbar: { show: true },
      animations: { enabled: false },
    },
    stroke: { curve: "smooth", width: 2 },
    markers: {
      size: 6,
      strokeColors: ["transparent", "#fff", "#fff"],
      strokeWidth: 2,
      hover: { size: 8 },
    },
    xaxis: {
      type: "datetime",
      labels: { style: { fontFamily: "Outfit" } },
    },
    yaxis: {
      labels: {
        style: { fontFamily: "Outfit" },
        formatter: (v: number) => `$${v.toLocaleString()}`,
      },
    },
    tooltip: {
      shared: true,
      x: { format: "dd MMM yyyy HH:mm" },
      y: { formatter: (v: number) => `$${v.toLocaleString()}` },
    },
    grid: {
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: true } },
    },
    legend: {
      show: true,
      position: "top",
      fontFamily: "Outfit",
      fontSize: "13px",
      markers: {
        shape: "circle",
        size: 8,
      },
    },
  };

  return <Chart options={options} series={series} type="line" height={380} />;
}

export function DrawdownChart({
  data,
}: {
  data: { time: number; value: number }[];
}) {
  const equityValues = data.map((d) => d.value);
  let peak = equityValues[0] || 0;
  const drawdowns = data.map((d) => {
    if (d.value > peak) peak = d.value;
    return [d.time, peak > 0 ? ((peak - d.value) / peak) * 100 : 0];
  });

  const options: ApexOptions = {
    colors: [chartColors[3]],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "area",
      toolbar: { show: false },
      animations: { enabled: false },
    },
    stroke: { curve: "smooth", width: 1 },
    fill: {
      type: "gradient",
      gradient: { opacityFrom: 0.5, opacityTo: 0.1 },
    },
    xaxis: {
      type: "datetime",
      labels: { style: { fontFamily: "Outfit" } },
    },
    yaxis: {
      labels: {
        style: { fontFamily: "Outfit" },
        formatter: (v: number) => `${v.toFixed(1)}%`,
      },
    },
    tooltip: {
      y: { formatter: (v: number) => `${v.toFixed(2)}%` },
    },
    grid: {
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: true } },
    },
  };
  const series = [{ name: "Drawdown", data: drawdowns }];
  return <Chart options={options} series={series} type="area" height={200} />;
}

export function TradePnlChart({
  trades,
}: {
  trades: { pnlPercent: number | null; exitReason: string | null }[];
}) {
  const closedTrades = trades.filter((t) => t.pnlPercent != null);
  if (closedTrades.length === 0) return null;

  const options: ApexOptions = {
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      toolbar: { show: false },
      animations: { enabled: false },
    },
    plotOptions: {
      bar: {
        distributed: true,
        borderRadius: 2,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: closedTrades.map((_, i) => `#${i + 1}`),
      labels: { style: { fontFamily: "Outfit", fontSize: "11px" } },
    },
    yaxis: {
      labels: {
        style: { fontFamily: "Outfit" },
        formatter: (v: number) => `${v.toFixed(1)}%`,
      },
    },
    tooltip: {
      y: { formatter: (v: number) => `${v.toFixed(2)}%` },
    },
    grid: {
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    colors: closedTrades.map((t) =>
      (t.pnlPercent ?? 0) >= 0 ? chartColors[1] : chartColors[3]
    ),
    legend: { show: false },
  };

  const series = [
    {
      name: "P&L %",
      data: closedTrades.map((t) => t.pnlPercent!),
    },
  ];

  return <Chart options={options} series={series} type="bar" height={220} />;
}

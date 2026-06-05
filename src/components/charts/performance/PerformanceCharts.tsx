import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

const chartColors = ["#465FFF", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

export function WsMessageDonut({
  parsed,
  errors,
}: {
  parsed: number;
  errors: number;
}) {
  const options: ApexOptions = {
    colors: [chartColors[1], chartColors[3]],
    chart: { fontFamily: "Outfit, sans-serif", type: "donut" },
    labels: ["Parsed", "Errors"],
    legend: { position: "bottom", fontFamily: "Outfit", fontSize: "13px" },
    dataLabels: { enabled: false },
    stroke: { show: false },
    plotOptions: {
      pie: {
        donut: {
          size: "75%",
          labels: {
            show: true,
            total: { show: true, fontFamily: "Outfit", label: "Total" },
          },
        },
      },
    },
    tooltip: {
      y: { formatter: (v: number) => v.toLocaleString() },
    },
  };
  const series = [parsed, errors];
  return (
    <Chart options={options} series={series} type="donut" height={260} />
  );
}

export function AlertDirectionDonut({
  pumps,
  dumps,
}: {
  pumps: number;
  dumps: number;
}) {
  const options: ApexOptions = {
    colors: [chartColors[1], chartColors[3]],
    chart: { fontFamily: "Outfit, sans-serif", type: "donut" },
    labels: ["Pumps", "Dumps"],
    legend: { position: "bottom", fontFamily: "Outfit", fontSize: "13px" },
    dataLabels: { enabled: false },
    stroke: { show: false },
    plotOptions: {
      pie: {
        donut: {
          size: "75%",
          labels: {
            show: true,
            total: { show: true, fontFamily: "Outfit", label: "Total" },
          },
        },
      },
    },
    tooltip: {
      y: { formatter: (v: number) => v.toLocaleString() },
    },
  };
  const series = [pumps, dumps];
  return (
    <Chart options={options} series={series} type="donut" height={260} />
  );
}

export function ConnectionPairsBar({
  connections,
}: {
  connections: { name: string; pairs: number }[];
}) {
  const options: ApexOptions = {
    colors: [chartColors[0]],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: connections.map((c) => c.name),
      labels: { style: { fontFamily: "Outfit" } },
    },
    yaxis: {
      labels: { style: { fontFamily: "Outfit", fontSize: "12px" } },
    },
    grid: {
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: false } },
    },
    tooltip: {
      y: { formatter: (v: number) => `${v} pairs` },
    },
  };
  const series = [
    { name: "Pairs", data: connections.map((c) => c.pairs) },
  ];
  return (
    <Chart options={options} series={series} type="bar" height={180} />
  );
}

export function ConnectionSummaryBar({
  active,
  opened,
  reconnections,
}: {
  active: number;
  opened: number;
  reconnections: number;
}) {
  const options: ApexOptions = {
    colors: [chartColors[0], chartColors[1], chartColors[2]],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "55%",
        borderRadius: 4,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: ["Active", "Opened", "Reconnections"],
      labels: { style: { fontFamily: "Outfit" } },
    },
    yaxis: {
      labels: { style: { fontFamily: "Outfit" } },
      min: 0,
      tickAmount: 4,
    },
    grid: {
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    tooltip: {
      y: { formatter: (v: number) => v.toLocaleString() },
    },
  };
  const series = [
    { name: "Count", data: [active, opened, reconnections] },
  ];
  return (
    <Chart options={options} series={series} type="bar" height={200} />
  );
}

export function TickerProcessingBar({
  processed,
  throttled,
}: {
  processed: number;
  throttled: number;
}) {
  const options: ApexOptions = {
    colors: [chartColors[0], chartColors[2]],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "50%",
        borderRadius: 4,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: ["Processed", "Throttled"],
      labels: { style: { fontFamily: "Outfit" } },
    },
    yaxis: {
      labels: { style: { fontFamily: "Outfit" } },
    },
    grid: {
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    tooltip: {
      y: { formatter: (v: number) => v.toLocaleString() },
    },
  };
  const series = [
    { name: "Count", data: [processed, throttled] },
  ];
  return (
    <Chart options={options} series={series} type="bar" height={180} />
  );
}
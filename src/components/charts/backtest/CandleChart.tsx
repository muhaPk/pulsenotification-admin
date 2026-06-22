import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, UTCTimestamp, CandlestickSeries, LineSeries, createSeriesMarkers } from "lightweight-charts";
import type { IPriceLine } from "lightweight-charts";
import type { BacktestCandle, BacktestTrade } from "../../../types/admin";

function ema(values: number[], period: number): (number | undefined)[] {
  const result: (number | undefined)[] = [];
  const multiplier = 2 / (period + 1);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      sum += values[i];
      result.push(undefined);
      continue;
    }
    if (i === period - 1) {
      sum += values[i];
      result.push(sum / period);
    } else {
      const prev = result[i - 1]!;
      result.push((values[i] - prev) * multiplier + prev);
    }
  }
  return result;
}

function adx(highs: number[], lows: number[], closes: number[], period: number): (number | undefined)[] {
  const n = highs.length;
  const result: (number | undefined)[] = new Array(n).fill(undefined);
  if (n < period * 2) return result;

  const tr: number[] = new Array(n).fill(0);
  const plusDM: number[] = new Array(n).fill(0);
  const minusDM: number[] = new Array(n).fill(0);

  for (let i = 1; i < n; i++) {
    const h = highs[i], l = lows[i], pc = closes[i - 1], ph = highs[i - 1], pl = lows[i - 1];
    tr[i] = Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc));
    const up = h - ph;
    const down = pl - l;
    plusDM[i] = up > down && up > 0 ? up : 0;
    minusDM[i] = down > up && down > 0 ? down : 0;
  }

  let avgTR = 0, avgPlusDM = 0, avgMinusDM = 0;
  for (let i = 1; i <= period; i++) {
    avgTR += tr[i];
    avgPlusDM += plusDM[i];
    avgMinusDM += minusDM[i];
  }
  avgTR /= period;
  avgPlusDM /= period;
  avgMinusDM /= period;

  const dxValues: number[] = new Array(n).fill(0);

  for (let i = period + 1; i < n; i++) {
    avgTR = (avgTR * (period - 1) + tr[i]) / period;
    avgPlusDM = (avgPlusDM * (period - 1) + plusDM[i]) / period;
    avgMinusDM = (avgMinusDM * (period - 1) + minusDM[i]) / period;
    const pDI = 100 * avgPlusDM / (avgTR || 1);
    const mDI = 100 * avgMinusDM / (avgTR || 1);
    const sumDI = pDI + mDI;
    dxValues[i] = sumDI > 0 ? 100 * Math.abs(pDI - mDI) / sumDI : 0;
  }

  let adxSum = 0;
  for (let i = period + 1; i <= period * 2; i++) {
    adxSum += dxValues[i];
  }
  let smoothed = adxSum / period;
  result[period * 2] = smoothed;

  for (let i = period * 2 + 1; i < n; i++) {
    smoothed = (smoothed * (period - 1) + dxValues[i]) / period;
    result[i] = smoothed;
  }

  return result;
}

function rsi(closes: number[], period: number): (number | undefined)[] {
  const n = closes.length;
  const result: (number | undefined)[] = new Array(n).fill(undefined);
  if (n < period + 1) return result;

  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;
  let rs = avgGain / (avgLoss || 0.001);
  result[period] = 100 - 100 / (1 + rs);

  for (let i = period + 1; i < n; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff >= 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    rs = avgGain / (avgLoss || 0.001);
    result[i] = 100 - 100 / (1 + rs);
  }

  return result;
}

function isDarkMode() {
  return document.documentElement.classList.contains("dark");
}

function chartColors(dark: boolean) {
  return {
    textColor: dark ? "#9ca3af" : "#6b7280",
    gridColor: dark ? "#374151" : "#d1d5db",
    borderColor: dark ? "#4b5563" : "#9ca3af",
    crosshairColor: dark ? "rgba(107,114,128,0.5)" : "rgba(75,85,99,0.5)",
  };
}

interface CandleChartProps {
  candles: BacktestCandle[];
  trades: BacktestTrade[];
  fastEMAPeriod?: number;
  slowEMAPeriod?: number;
  emaEnabled?: boolean;
  adxEnabled?: boolean;
  rsiEnabled?: boolean;
  rsiPeriod?: number;
}

export default function CandleChart({ candles, trades, fastEMAPeriod = 50, slowEMAPeriod = 200, emaEnabled = true, adxEnabled = true, rsiEnabled = true, rsiPeriod = 14 }: CandleChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dark, setDark] = useState(isDarkMode);
  const [showEMA, setShowEMA] = useState(emaEnabled);
  const [showADX, setShowADX] = useState(adxEnabled);
  const [showRSI, setShowRSI] = useState(rsiEnabled);
  const emaFastSeriesRef = useRef<any>(null);
  const emaSlowSeriesRef = useRef<any>(null);
  const adxSeriesRef = useRef<any>(null);
  const rsiSeriesRef = useRef<any>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    const html = document.documentElement;
    const observer = new MutationObserver(() => setDark(isDarkMode()));
    observer.observe(html, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!containerRef.current || candles.length === 0) return;

    const colors = chartColors(dark);

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: colors.textColor,
      },
      grid: {
        vertLines: { color: colors.gridColor },
        horzLines: { color: colors.gridColor },
      },
      crosshair: {
        mode: 0,
        vertLine: {
          color: colors.crosshairColor,
          width: 1,
          style: 2,
          labelBackgroundColor: colors.crosshairColor,
        },
        horzLine: {
          color: colors.crosshairColor,
          width: 1,
          style: 2,
          labelBackgroundColor: colors.crosshairColor,
        },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: colors.borderColor,
        tickMarkFormatter: (time: number) => {
          const d = new Date(time * 1000);
          return d.toLocaleDateString('en-GB', { timeZone: 'UTC' });
        },
      },
      rightPriceScale: {
        borderColor: colors.borderColor,
      },
      localization: {
        locale: 'en-GB',
        timeFormatter: (time: number) => {
          const d = new Date(time * 1000);
          return d.toLocaleString('en-GB', {
            timeZone: 'UTC',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
        },
      },
      width: containerRef.current.clientWidth,
      height: Math.max(containerRef.current.clientHeight, 300),
      handleScroll: true,
      handleScale: true,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#10B981",
      downColor: "#EF4444",
      borderDownColor: "#EF4444",
      borderUpColor: "#10B981",
      wickDownColor: "#EF4444",
      wickUpColor: "#10B981",
      lastValueVisible: false,
      priceLineVisible: false,
    });

    candleSeries.setData(
      candles.map((c) => ({
        time: (c.timestamp / 1000) as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
    );

    const closes = candles.map(c => c.close);
    const emaFast = ema(closes, fastEMAPeriod);
    const emaSlow = ema(closes, slowEMAPeriod);

    const emaFastSeries = chart.addSeries(LineSeries, {
      color: "#3B82F6",
      lineWidth: 1,
      lastValueVisible: false,
      priceLineVisible: false,
      crosshairMarkerVisible: false,
    });
    const emaSlowSeries = chart.addSeries(LineSeries, {
      color: "#F97316",
      lineWidth: 1,
      lastValueVisible: false,
      priceLineVisible: false,
      crosshairMarkerVisible: false,
    });

    if (showEMA) {
      emaFastSeries.setData(
        candles
          .map((c, i) => ({ time: (c.timestamp / 1000) as UTCTimestamp, value: emaFast[i] }))
          .filter((d): d is { time: UTCTimestamp; value: number } => d.value != null && !isNaN(d.value))
      );
      emaSlowSeries.setData(
        candles
          .map((c, i) => ({ time: (c.timestamp / 1000) as UTCTimestamp, value: emaSlow[i] }))
          .filter((d): d is { time: UTCTimestamp; value: number } => d.value != null && !isNaN(d.value))
      );
    }

    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    const adxValues = adx(highs, lows, closes, 14);

    const adxSeries = chart.addSeries(LineSeries, {
      color: "#8B5CF6",
      lineWidth: 1,
      lastValueVisible: false,
      priceLineVisible: false,
      crosshairMarkerVisible: false,
      priceScaleId: "adx",
    });

    chart.priceScale("adx").applyOptions({
      scaleMargins: { top: 0.75, bottom: 0 },
    });

    if (showADX) {
      adxSeries.setData(
        candles
          .map((c, i) => ({ time: (c.timestamp / 1000) as UTCTimestamp, value: adxValues[i] }))
          .filter((d): d is { time: UTCTimestamp; value: number } => d.value != null && !isNaN(d.value))
      );
    }

    adxSeries.createPriceLine({
      price: 25,
      color: "#8B5CF6",
      lineWidth: 1,
      lineStyle: 2,
      axisLabelVisible: true,
      title: "ADX 25",
    });

      const rsiValues = rsi(closes, rsiPeriod);

    const rsiSeries = chart.addSeries(LineSeries, {
      color: "#22C55E",
      lineWidth: 1,
      lastValueVisible: false,
      priceLineVisible: false,
      crosshairMarkerVisible: false,
      priceScaleId: "rsi",
    });

    chart.priceScale("rsi").applyOptions({
      scaleMargins: { top: 0.5, bottom: 0.25 },
    });

    if (showRSI) {
      rsiSeries.setData(
        candles
          .map((c, i) => ({ time: (c.timestamp / 1000) as UTCTimestamp, value: rsiValues[i] }))
          .filter((d): d is { time: UTCTimestamp; value: number } => d.value != null && !isNaN(d.value))
      );
    }

    rsiSeries.createPriceLine({
      price: 70,
      color: "#EF4444",
      lineWidth: 1,
      lineStyle: 2,
      axisLabelVisible: true,
      title: "70",
    });
    rsiSeries.createPriceLine({
      price: 30,
      color: "#10B981",
      lineWidth: 1,
      lineStyle: 2,
      axisLabelVisible: true,
      title: "30",
    });

    chartRef.current = chart;
    emaFastSeriesRef.current = emaFastSeries;
    emaSlowSeriesRef.current = emaSlowSeries;
    adxSeriesRef.current = adxSeries;
    rsiSeriesRef.current = rsiSeries;

    const markers = trades.flatMap((t) => {
      const result: any[] = [];
      const isLong = t.side === "LONG";
      const entryList = t.entries && t.entries.length > 0 ? t.entries : [{ time: t.entryTime, price: t.entryPrice }];
      entryList.forEach((e, idx) => {
        const entryTime = Math.floor(new Date(e.time).getTime() / 1000);
        result.push({
          time: entryTime as UTCTimestamp,
          position: "aboveBar",
          color: isLong ? "#22C55E" : "#EF4444",
          shape: "circle",
          size: 0,
          text: isLong ? (idx === 0 ? " L " : " L2") : (idx === 0 ? " S " : " S2"),
        });
      });
      if (t.exitPrice != null && t.exitTime) {
        const exitTime = Math.floor(new Date(t.exitTime).getTime() / 1000);
        const pnlStr = t.pnlPercent != null ? `${t.pnlPercent.toFixed(1)}%` : "";
        const reasonLabel =
          t.exitReason === "stop_loss" ? `SL ${pnlStr}` :
          t.exitReason === "trailing_stop" ? `TS ${pnlStr}` :
          t.exitReason === "signal" ? `Sig ${pnlStr}` :
          t.exitReason?.replace(/_/g, " ").toUpperCase() || "X";
        result.push({
          time: exitTime as UTCTimestamp,
          position: "belowBar",
          color: t.exitReason === "stop_loss" ? "#EC4899" : t.exitReason === "trailing_stop" ? "#F59E0B" : t.pnlPercent != null && t.pnlPercent >= 0 ? "#22C55E" : "#EF4444",
          shape: "circle",
          size: 0,
          text: ` ${reasonLabel} `,
        });
      }
      return result;
    });

    if (markers.length > 0) {
      createSeriesMarkers(candleSeries, markers);
    }

    const priceLineInfos: { time: number; line: IPriceLine; color: string; title: string }[] = [];

    trades.forEach((t) => {
      const isLong = t.side === "LONG";
      const entryList = t.entries && t.entries.length > 0 ? t.entries : [{ time: t.entryTime, price: t.entryPrice }];
      entryList.forEach((e) => {
        const time = Math.floor(new Date(e.time).getTime() / 1000);
        const color = isLong ? "#22C55E" : "#EF4444";
        const line = candleSeries.createPriceLine({
          price: e.price,
          color: "transparent",
          lineWidth: 1,
          lineStyle: 2,
          axisLabelVisible: false,
          title: "",
        });
        priceLineInfos.push({ time, line, color, title: "" });
      });
      if (t.exitPrice != null && t.exitTime) {
        const time = Math.floor(new Date(t.exitTime).getTime() / 1000);
        const color = t.exitReason === "stop_loss" ? "#EC4899" : t.exitReason === "trailing_stop" ? "#F59E0B" : t.pnlPercent != null && t.pnlPercent >= 0 ? "#22C55E" : "#EF4444";
        const reasonLabel =
          t.exitReason === "stop_loss" ? "SL" :
          t.exitReason === "trailing_stop" ? "TS" :
          t.exitReason === "signal" ? "Sig" :
          t.exitReason?.replace(/_/g, " ").toUpperCase() || "X";
        const line = candleSeries.createPriceLine({
          price: t.exitPrice,
          color: "transparent",
          lineWidth: 1,
          lineStyle: 2,
          axisLabelVisible: false,
          title: "",
        });
        priceLineInfos.push({ time, line, color, title: reasonLabel });
      }
    });

    chart.subscribeCrosshairMove((param) => {
      const hoverTime = param.time as number | undefined;
      for (const info of priceLineInfos) {
        if (hoverTime != null && info.time === hoverTime) {
          info.line.applyOptions({ color: info.color, axisLabelVisible: true, title: info.title });
        } else {
          info.line.applyOptions({ color: "transparent", axisLabelVisible: false, title: "" });
        }
      }
    });

    const handleResize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        chart.applyOptions({ width: clientWidth });
        if (clientHeight > 0) {
          chart.applyOptions({ height: clientHeight });
        }
      }
    };
    window.addEventListener("resize", handleResize);

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(containerRef.current);

    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [candles, trades, dark]);

  useEffect(() => {
    if (!showEMA) {
      emaFastSeriesRef.current?.setData([]);
      emaSlowSeriesRef.current?.setData([]);
    } else if (containerRef.current && candles.length > 0) {
      const closes = candles.map(c => c.close);
      const emaFast = ema(closes, fastEMAPeriod);
      const emaSlow = ema(closes, slowEMAPeriod);
      emaFastSeriesRef.current?.setData(
        candles
          .map((c, i) => ({ time: (c.timestamp / 1000) as UTCTimestamp, value: emaFast[i] }))
          .filter((d): d is { time: UTCTimestamp; value: number } => d.value != null && !isNaN(d.value))
      );
      emaSlowSeriesRef.current?.setData(
        candles
          .map((c, i) => ({ time: (c.timestamp / 1000) as UTCTimestamp, value: emaSlow[i] }))
          .filter((d): d is { time: UTCTimestamp; value: number } => d.value != null && !isNaN(d.value))
      );
    }
  }, [showEMA]);

  useEffect(() => {
    if (!showADX) {
      adxSeriesRef.current?.setData([]);
    } else if (containerRef.current && candles.length > 0) {
      const closes = candles.map(c => c.close);
      const highs = candles.map(c => c.high);
      const lows = candles.map(c => c.low);
      const adxValues = adx(highs, lows, closes, 14);
      adxSeriesRef.current?.setData(
        candles
          .map((c, i) => ({ time: (c.timestamp / 1000) as UTCTimestamp, value: adxValues[i] }))
          .filter((d): d is { time: UTCTimestamp; value: number } => d.value != null && !isNaN(d.value))
      );
    }
  }, [showADX]);

  useEffect(() => {
    if (!showRSI) {
      rsiSeriesRef.current?.setData([]);
    } else if (containerRef.current && candles.length > 0) {
      const closes = candles.map(c => c.close);
    const rsiValues = rsi(closes, rsiPeriod);
      rsiSeriesRef.current?.setData(
        candles
          .map((c, i) => ({ time: (c.timestamp / 1000) as UTCTimestamp, value: rsiValues[i] }))
          .filter((d): d is { time: UTCTimestamp; value: number } => d.value != null && !isNaN(d.value))
      );
    }
  }, [showRSI]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    if (showADX && showRSI) {
      chart.priceScale("rsi")?.applyOptions({ scaleMargins: { top: 0.5, bottom: 0.25 } });
      chart.priceScale("adx")?.applyOptions({ scaleMargins: { top: 0.75, bottom: 0 } });
    } else if (showADX) {
      chart.priceScale("adx")?.applyOptions({ scaleMargins: { top: 0.75, bottom: 0 } });
    } else if (showRSI) {
      chart.priceScale("rsi")?.applyOptions({ scaleMargins: { top: 0.75, bottom: 0 } });
    }
  }, [showADX, showRSI]);

  if (candles.length === 0) {
    return (
      <div className="flex items-center justify-center h-[450px] text-sm text-gray-400">
        No chart data available
      </div>
    );
  }

  return (
    <div className="relative w-full flex-1 min-h-0 flex flex-col">
      <div className="flex items-center gap-2 px-1 pb-1 shrink-0">
        <button
          onClick={() => setShowEMA(v => !v)}
          className={`px-2 py-0.5 text-xs font-medium rounded ${
            showEMA
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          }`}
        >
          EMA
        </button>
        <button
          onClick={() => setShowADX(v => !v)}
          className={`px-2 py-0.5 text-xs font-medium rounded ${
            showADX
              ? "bg-purple-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          }`}
        >
          ADX
        </button>
        <button
          onClick={() => setShowRSI(v => !v)}
          className={`px-2 py-0.5 text-xs font-medium rounded ${
            showRSI
              ? "bg-green-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          }`}
        >
          RSI
        </button>
      </div>
      <div ref={containerRef} className="w-full flex-1 min-h-0" />
    </div>
  );
}

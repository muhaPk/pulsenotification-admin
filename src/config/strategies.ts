export interface ParamDef {
  key: string;
  label: string;
  default: number;
  min: number;
  max: number;
  step: number;
}

export interface StrategyGroup {
  key: string;
  label: string;
  paramDefs: ParamDef[];
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  groups: StrategyGroup[];
}

export const STRATEGIES: Strategy[] = [
  {
    id: "trend-pullback",
    name: "Trend Pullback",
    description: "Directional strategy: LONG on pullbacks in uptrend, SHORT on bounces in downtrend. Uses EMA50/200 for trend, ADX > 25 for strength, RSI for entry timing. Includes yearly-range position biasing, scale-in add-ons, and trailing stops.",
    groups: [
      {
        key: "ema",
        label: "EMA",
        paramDefs: [
          { key: "emaEnabled", label: "EMA Filter", default: 1, min: 0, max: 1, step: 1 },
          { key: "fastEMA", label: "Fast EMA Period", default: 50, min: 5, max: 200, step: 1 },
          { key: "slowEMA", label: "Slow EMA Period", default: 200, min: 10, max: 400, step: 1 },
          { key: "directionFilter", label: "Direction (0=Both, 1=Long, 2=Short)", default: 0, min: 0, max: 2, step: 1 },
        ],
      },
      {
        key: "adx",
        label: "ADX",
        paramDefs: [
          { key: "adxEnabled", label: "ADX Filter", default: 1, min: 0, max: 1, step: 1 },
          { key: "adxPeriod", label: "ADX Period", default: 14, min: 5, max: 50, step: 1 },
          { key: "adxThreshold", label: "ADX Threshold (>)", default: 25, min: 5, max: 50, step: 1 },
        ],
      },
      {
        key: "rsi",
        label: "RSI",
        paramDefs: [
          { key: "rsiEnabled", label: "RSI Filter", default: 1, min: 0, max: 1, step: 1 },
          { key: "rsiPeriod", label: "RSI Period", default: 14, min: 2, max: 50, step: 1 },
          { key: "rsiLongThreshold", label: "RSI Long Entry (<)", default: 40, min: 5, max: 95, step: 1 },
          { key: "rsiShortThreshold", label: "RSI Short Entry (>)", default: 65, min: 5, max: 95, step: 1 },
        ],
      },
      {
        key: "bias",
        label: "Yearly Range Bias",
        paramDefs: [
          { key: "biasEnabled", label: "Yearly Range Bias", default: 1, min: 0, max: 1, step: 1 },
          { key: "yearlyRangeLookback", label: "Lookback", default: 8760, min: 100, max: 100000, step: 100 },
          { key: "biasZoneTop", label: "Bias Short Zone Top %", default: 80, min: 50, max: 100, step: 1 },
          { key: "biasZoneBottom", label: "Bias Long Zone Bottom %", default: 20, min: 0, max: 50, step: 1 },
        ],
      },
      {
        key: "long",
        label: "Long",
        paramDefs: [
          { key: "longFirstPct", label: "First Entry %", default: 40, min: 5, max: 100, step: 5 },
          { key: "longAddonEnabled", label: "Add-on", default: 1, min: 0, max: 1, step: 1 },
          { key: "longAddonPct", label: "Add-on %", default: 60, min: 0, max: 100, step: 5 },
          { key: "longAddonTriggerPct", label: "Add-on Trigger (%)", default: -3, min: -20, max: 0, step: 1 },
          { key: "longAddonStopLoss", label: "Add-on Stop Loss %", default: 0, min: 0, max: 50, step: 1 },
          { key: "longStopLoss", label: "Stop Loss %", default: 6, min: 1, max: 50, step: 1 },
          { key: "longTrailingEnabled", label: "Trailing", default: 1, min: 0, max: 1, step: 1 },
          { key: "longTrailingActivationPct", label: "Trailing Activation %", default: 8, min: 1, max: 100, step: 1 },
          { key: "longTrailingOffsetPct", label: "Trailing Offset %", default: 4, min: 1, max: 50, step: 1 },
          { key: "longRetryOffsetTrailingPct", label: "Re-entry Trailing %", default: 2, min: 0, max: 20, step: 0.5 },
        ],
      },
      {
        key: "short",
        label: "Short",
        paramDefs: [
          { key: "shortFirstPct", label: "First Entry %", default: 60, min: 5, max: 100, step: 5 },
          { key: "shortAddonEnabled", label: "Add-on", default: 1, min: 0, max: 1, step: 1 },
          { key: "shortAddonPct", label: "Add-on %", default: 40, min: 0, max: 100, step: 5 },
          { key: "shortAddonTriggerPct", label: "Add-on Trigger (%)", default: 3, min: 0, max: 20, step: 1 },
          { key: "shortAddonStopLoss", label: "Add-on Stop Loss %", default: 0, min: 0, max: 50, step: 1 },
          { key: "shortStopLoss", label: "Stop Loss %", default: 5, min: 1, max: 50, step: 1 },
          { key: "shortTrailingEnabled", label: "Trailing", default: 1, min: 0, max: 1, step: 1 },
          { key: "shortTrailingActivationPct", label: "Trailing Activation %", default: 6, min: 1, max: 100, step: 1 },
          { key: "shortTrailingOffsetPct", label: "Trailing Offset %", default: 3, min: 1, max: 50, step: 1 },
          { key: "shortRetryOffsetTrailingPct", label: "Re-entry Trailing %", default: 2, min: 0, max: 20, step: 0.5 },
        ],
      },
    ],
  },
  {
    id: "adaptive-rsi-trend",
    name: "Adaptive RSI Trend",
    description: "Switches between RSI mean-reversion in ranging markets (ADX low) and EMA trend-following in trending markets (ADX high). Auto-adapts to market conditions.",
    groups: [
      {
        key: "adxRegime",
        label: "ADX Regime",
        paramDefs: [
          { key: "adxPeriod", label: "ADX Period", default: 14, min: 5, max: 50, step: 1 },
          { key: "adxThreshold", label: "ADX Threshold", default: 40, min: 10, max: 50, step: 1 },
        ],
      },
      {
        key: "rangeMode",
        label: "Range Mode",
        paramDefs: [
          { key: "rangeRsiPeriod", label: "RSI Period", default: 7, min: 2, max: 50, step: 1 },
          { key: "rangeRsiOversold", label: "RSI Oversold (<)", default: 15, min: 5, max: 50, step: 1 },
          { key: "rangeRsiOverbought", label: "RSI Overbought (>)", default: 85, min: 50, max: 95, step: 1 },
          { key: "rangeRsiExitLong", label: "RSI Exit Long (>)", default: 55, min: 40, max: 90, step: 1 },
          { key: "rangeRsiExitShort", label: "RSI Exit Short (<)", default: 45, min: 10, max: 60, step: 1 },
          { key: "rangeStopLossPct", label: "Range Stop Loss %", default: 4, min: 1, max: 15, step: 1 },
        ],
      },
      {
        key: "trendMode",
        label: "Trend Mode",
        paramDefs: [
          { key: "trendFastEMA", label: "Fast EMA Period", default: 100, min: 5, max: 200, step: 1 },
          { key: "trendSlowEMA", label: "Slow EMA Period", default: 200, min: 10, max: 400, step: 1 },
          { key: "trendRsiPullbackLong", label: "RSI Pullback Long (<)", default: 35, min: 5, max: 80, step: 1 },
          { key: "trendRsiPullbackShort", label: "RSI Pullback Short (>)", default: 65, min: 20, max: 95, step: 1 },
        ],
      },
      {
        key: "long",
        label: "Long",
        paramDefs: [
          { key: "longFirstPct", label: "First Entry %", default: 100, min: 5, max: 100, step: 5 },
          { key: "longStopLoss", label: "Stop Loss %", default: 10, min: 1, max: 50, step: 1 },
          { key: "longTrailingEnabled", label: "Trailing", default: 1, min: 0, max: 1, step: 1 },
          { key: "longTrailingActivationPct", label: "Trailing Activation %", default: 25, min: 1, max: 100, step: 1 },
          { key: "longTrailingOffsetPct", label: "Trailing Offset %", default: 15, min: 1, max: 50, step: 1 },
        ],
      },
      {
        key: "short",
        label: "Short",
        paramDefs: [
          { key: "shortFirstPct", label: "First Entry %", default: 100, min: 5, max: 100, step: 5 },
          { key: "shortStopLoss", label: "Stop Loss %", default: 10, min: 1, max: 50, step: 1 },
          { key: "shortTrailingEnabled", label: "Trailing", default: 1, min: 0, max: 1, step: 1 },
          { key: "shortTrailingActivationPct", label: "Trailing Activation %", default: 25, min: 1, max: 100, step: 1 },
          { key: "shortTrailingOffsetPct", label: "Trailing Offset %", default: 15, min: 1, max: 50, step: 1 },
        ],
      },
      {
        key: "direction",
        label: "Direction",
        paramDefs: [
          { key: "directionFilter", label: "Direction (0=Both, 1=Long, 2=Short)", default: 0, min: 0, max: 2, step: 1 },
          { key: "reversed", label: "Reversed", default: 0, min: 0, max: 1, step: 1 },
          { key: "takeProfitPct", label: "Take Profit %", default: 10, min: 1, max: 50, step: 1 },
        ],
      },
    ],
  },
  {
    id: "mean-reversion",
    name: "Mean Reversion",
    description: "Flat direction: BUY when RSI < oversold threshold (default 25), SELL when RSI > overbought threshold (default 75). Exits when RSI crosses back toward the midline. Pure mean-reversion on a single pair.",
    groups: [
      {
        key: "rsi",
        label: "RSI",
        paramDefs: [
          { key: "rsiPeriod", label: "RSI Period", default: 14, min: 2, max: 50, step: 1 },
          { key: "rsiOversoldThreshold", label: "Oversold (<)", default: 25, min: 5, max: 45, step: 1 },
          { key: "rsiOverboughtThreshold", label: "Overbought (>)", default: 75, min: 55, max: 95, step: 1 },
        ],
      },
      {
        key: "exit",
        label: "Exit",
        paramDefs: [
          { key: "rsiExitLong", label: "Exit Long RSI (>)", default: 50, min: 30, max: 80, step: 1 },
          { key: "rsiExitShort", label: "Exit Short RSI (<)", default: 50, min: 20, max: 70, step: 1 },
        ],
      },
      {
        key: "direction",
        label: "Direction",
        paramDefs: [
          { key: "directionFilter", label: "Direction (0=Both, 1=Long, 2=Short)", default: 0, min: 0, max: 2, step: 1 },
          { key: "slCooldownCandles", label: "SL Cooldown Candles", default: 0, min: 0, max: 50, step: 1 },
        ],
      },
      {
        key: "long",
        label: "Long",
        paramDefs: [
          { key: "longFirstPct", label: "First Entry %", default: 100, min: 5, max: 100, step: 5 },
          { key: "longAddonEnabled", label: "Add-on", default: 0, min: 0, max: 1, step: 1 },
          { key: "longAddonPct", label: "Add-on %", default: 60, min: 0, max: 100, step: 5 },
          { key: "longAddonTriggerPct", label: "Add-on Trigger (%)", default: -3, min: -20, max: 0, step: 1 },
          { key: "longAddonStopLoss", label: "Add-on Stop Loss %", default: 0, min: 0, max: 50, step: 1 },
          { key: "longStopLoss", label: "Stop Loss %", default: 6, min: 1, max: 50, step: 1 },
          { key: "longTrailingEnabled", label: "Trailing", default: 1, min: 0, max: 1, step: 1 },
          { key: "longTrailingActivationPct", label: "Trailing Activation %", default: 8, min: 1, max: 100, step: 1 },
          { key: "longTrailingOffsetPct", label: "Trailing Offset %", default: 4, min: 1, max: 50, step: 1 },
        ],
      },
      {
        key: "short",
        label: "Short",
        paramDefs: [
          { key: "shortFirstPct", label: "First Entry %", default: 100, min: 5, max: 100, step: 5 },
          { key: "shortAddonEnabled", label: "Add-on", default: 0, min: 0, max: 1, step: 1 },
          { key: "shortAddonPct", label: "Add-on %", default: 40, min: 0, max: 100, step: 5 },
          { key: "shortAddonTriggerPct", label: "Add-on Trigger (%)", default: 3, min: 0, max: 20, step: 1 },
          { key: "shortAddonStopLoss", label: "Add-on Stop Loss %", default: 0, min: 0, max: 50, step: 1 },
          { key: "shortStopLoss", label: "Stop Loss %", default: 6, min: 1, max: 50, step: 1 },
          { key: "shortTrailingEnabled", label: "Trailing", default: 1, min: 0, max: 1, step: 1 },
          { key: "shortTrailingActivationPct", label: "Trailing Activation %", default: 8, min: 1, max: 100, step: 1 },
          { key: "shortTrailingOffsetPct", label: "Trailing Offset %", default: 4, min: 1, max: 50, step: 1 },
        ],
      },
    ],
  },
  {
    id: "trend-accumulation",
    name: "Trend Accumulation",
    description: "DCA + Pullback: accumulates positions during uptrend (EMA50>EMA200, ADX>25). First entry on trend flip, DCA entries on RSI oversold pullbacks. Exits via trailing stop or trend reversal.",
    groups: [
      {
        key: "trend",
        label: "Trend",
        paramDefs: [
          { key: "emaFast", label: "Fast EMA", default: 50, min: 10, max: 200, step: 1 },
          { key: "emaSlow", label: "Slow EMA", default: 200, min: 50, max: 400, step: 1 },
          { key: "emaEntry", label: "Entry EMA", default: 20, min: 5, max: 100, step: 1 },
          { key: "adxPeriod", label: "ADX Period", default: 14, min: 7, max: 50, step: 1 },
          { key: "adxThreshold", label: "ADX Threshold (>)", default: 25, min: 15, max: 50, step: 1 },
        ],
      },
      {
        key: "dca",
        label: "DCA",
        paramDefs: [
          { key: "rsiPeriod", label: "RSI Period", default: 14, min: 7, max: 50, step: 1 },
          { key: "rsiOversold", label: "RSI Oversold (<)", default: 38, min: 20, max: 45, step: 1 },
          { key: "dcaMaxEntries", label: "Max DCA Entries", default: 5, min: 1, max: 10, step: 1 },
          { key: "dcaMinDropPct", label: "Min Drop % for DCA", default: 3, min: 1, max: 10, step: 0.5 },
        ],
      },
      {
        key: "sizing",
        label: "Sizing",
        paramDefs: [
          { key: "longFirstPct", label: "First Entry %", default: 30, min: 5, max: 100, step: 5 },
          { key: "longAddonPct", label: "Addon %", default: 20, min: 5, max: 100, step: 5 },
        ],
      },
      {
        key: "exit",
        label: "Exit",
        paramDefs: [
          { key: "longStopLoss", label: "Stop Loss %", default: 10, min: 1, max: 30, step: 1 },
          { key: "longTrailingEnabled", label: "Trailing", default: 1, min: 0, max: 1, step: 1 },
          { key: "longTrailingActivationPct", label: "Trail Activation %", default: 5, min: 1, max: 20, step: 1 },
          { key: "longTrailingOffsetPct", label: "Trail Offset %", default: 3, min: 1, max: 10, step: 1 },
          { key: "exitCooldownCandles", label: "Exit Cooldown", default: 3, min: 0, max: 20, step: 1 },
        ],
      },
    ],
  },
];

export function initParams(strategyId: string): Record<string, number> {
  const s = STRATEGIES.find(st => st.id === strategyId);
  if (!s) return {};
  const p: Record<string, number> = {};
  for (const g of s.groups) for (const d of g.paramDefs) p[d.key] = d.default;
  return p;
}

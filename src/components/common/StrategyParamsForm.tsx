import { Strategy, StrategyGroup, ParamDef } from "../../config/strategies";

interface Props {
  strategy: Strategy;
  params: Record<string, number>;
  onChange: (key: string, value: number) => void;
}

const depMap: Record<string, string[]> = {
  emaEnabled: ["fastEMA", "slowEMA"],
  adxEnabled: ["adxPeriod", "adxThreshold"],
  rsiEnabled: ["rsiLongThreshold", "rsiShortThreshold"],
  biasEnabled: ["yearlyRangeLookback", "biasZoneTop", "biasZoneBottom"],
  longAddonEnabled: ["longAddonPct", "longAddonTriggerPct", "longAddonStopLoss"],
  longTrailingEnabled: ["longTrailingActivationPct", "longTrailingOffsetPct"],
  shortAddonEnabled: ["shortAddonPct", "shortAddonTriggerPct", "shortAddonStopLoss"],
  shortTrailingEnabled: ["shortTrailingActivationPct", "shortTrailingOffsetPct"],
};

const allDeps = Object.values(depMap).flat();
const toggleKeys = Object.keys(depMap);

export default function StrategyParamsForm({ strategy, params, onChange }: Props) {
  return (
    <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
      <p className="mb-3 text-xs text-gray-500">{strategy.description}</p>
      {strategy.groups.map((group) => renderGroup(group, params, onChange))}
    </div>
  );
}

function renderGroup(group: StrategyGroup, params: Record<string, number>, onChange: (key: string, value: number) => void) {
  const standalone = group.paramDefs.filter(d => !allDeps.includes(d.key) && !toggleKeys.includes(d.key));
  const toggleGroups = group.paramDefs
    .filter(d => depMap[d.key])
    .map(t => ({ toggle: t, deps: depMap[t.key].map(k => group.paramDefs.find(d => d.key === k)!).filter(Boolean) }));

  return (
    <div key={group.key} className="mb-4">
      <h4 className={`mb-2 text-xs font-semibold uppercase tracking-wider ${
        group.key === "long" ? "text-green-600 dark:text-green-400" :
        group.key === "short" ? "text-red-600 dark:text-red-400" :
        "text-gray-500 dark:text-gray-400"
      }`}>
        {group.label}
      </h4>
      {standalone.length > 0 && (
        <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-6">
          {standalone.map(def => {
            const disabled = isDisabled(def.key, params);
            return (
              <div key={def.key}>
                <label className={`mb-0.5 block text-xs font-medium ${disabled ? "text-gray-400 dark:text-gray-500" : "text-gray-600 dark:text-gray-400"}`}>
                  {def.label}
                </label>
                {def.key === "directionFilter" ? (
                  <select value={params[def.key] ?? def.default} onChange={e => onChange(def.key, Number(e.target.value))} disabled={disabled}
                    className={`w-[100px] rounded-md border px-1.5 py-1 text-sm ${disabled ? "border-gray-200 bg-gray-100 text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed" : "border-gray-300 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"}`}>
                    <option value={0}>Both</option>
                    <option value={1}>Long</option>
                    <option value={2}>Short</option>
                  </select>
                ) : def.key === "reversed" ? (
                  <select value={params[def.key] ?? def.default} onChange={e => onChange(def.key, Number(e.target.value))} disabled={disabled}
                    className={`w-[100px] rounded-md border px-1.5 py-1 text-sm ${disabled ? "border-gray-200 bg-gray-100 text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed" : "border-gray-300 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"}`}>
                    <option value={0}>No</option>
                    <option value={1}>Yes</option>
                  </select>
                ) : (
                  <input type="number" value={params[def.key] ?? def.default} onChange={e => { onChange(def.key, Number(e.target.value)); if (def.key === "longFirstPct" || def.key === "shortFirstPct") adjustAddon(def, params, onChange); }}
                    min={def.min} max={def.max} step={def.step} disabled={disabled}
                    className={`w-[100px] rounded-md border px-1.5 py-1 text-sm ${disabled ? "border-gray-200 bg-gray-100 text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed" : "border-gray-300 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"}`} />
                )}
              </div>
            );
          })}
        </div>
      )}
      {toggleGroups.map(({ toggle, deps }) => {
        const off = (params[toggle.key] ?? toggle.default) === 0;
        return (
          <div key={toggle.key} className="mb-2 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{toggle.label}</span>
              <div className="relative inline-flex items-center">
                <input type="checkbox" checked={!off} onChange={e => onChange(toggle.key, e.target.checked ? 1 : 0)} className="peer sr-only" />
                <div className="h-5 w-9 rounded-full bg-red-400 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-green-500 peer-checked:after:translate-x-full dark:bg-red-500 dark:peer-checked:bg-green-600"></div>
              </div>
              <span className={`text-xs font-medium ${off ? "text-red-500" : "text-green-600"}`}>{off ? "OFF" : "ON"}</span>
            </label>
            {deps.map(def => (
              <div key={def.key}>
                <label className={`mb-0.5 block text-xs font-medium ${off ? "text-gray-400 dark:text-gray-500" : "text-gray-600 dark:text-gray-400"}`}>
                  {def.label}
                </label>
                <input type="number" value={params[def.key] ?? def.default} onChange={e => onChange(def.key, Number(e.target.value))}
                  min={def.min} max={def.max} step={def.step} disabled={off}
                  className={`w-[100px] rounded-md border px-1.5 py-1 text-sm ${off ? "border-gray-200 bg-gray-100 text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed" : "border-gray-300 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"}`} />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function isDisabled(key: string, params: Record<string, number>): boolean {
  if ((key === "longStopLoss" || key === "longAddonStopLoss") && (params["longAddonEnabled"] ?? 0) !== 0) return true;
  if ((key === "shortStopLoss" || key === "shortAddonStopLoss") && (params["shortAddonEnabled"] ?? 0) !== 0) return true;
  return false;
}

function adjustAddon(def: ParamDef, params: Record<string, number>, onChange: (key: string, value: number) => void) {
  const val = params[def.key] ?? def.default;
  const addonMax = Math.max(0, 100 - val);
  if (def.key === "longFirstPct") {
    const curAddon = params["longAddonPct"] ?? 60;
    if (curAddon > addonMax) onChange("longAddonPct", addonMax);
  }
  if (def.key === "shortFirstPct") {
    const curAddon = params["shortAddonPct"] ?? 40;
    if (curAddon > addonMax) onChange("shortAddonPct", addonMax);
  }
}

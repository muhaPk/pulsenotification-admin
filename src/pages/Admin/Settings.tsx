import { useState, useEffect, useRef } from "react";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { useGenericGetWeb } from "../../hooks/useGenericGetWeb";
import { useGenericSet } from "../../hooks/useGenericSetWeb";
import { API_SETTINGS } from "../../config/endpoints";

export default function AdminSettings() {
  const { data, loadData } = useGenericGetWeb();
  const loadDataRef = useRef(loadData);
  loadDataRef.current = loadData;

  const { submitting, uploadData, success } = useGenericSet();
  const [multiplier, setMultiplier] = useState("3");

  useEffect(() => {
    loadDataRef.current({ api: API_SETTINGS });
  }, []);

  useEffect(() => {
    if (data?.data?.MULTIPLIER) {
      setMultiplier(data.data.MULTIPLIER);
    }
  }, [data]);

  const handleSave = () => {
    uploadData({
      api: `${API_SETTINGS}/MULTIPLIER`,
      method: "put",
      data: { key: "MULTIPLIER", value: multiplier },
      dataCallback: () => loadDataRef.current({ api: API_SETTINGS }),
    });
  };

  return (
    <>
      <PageMeta
        title="Settings | Admin Dashboard"
        description="Manage application settings"
      />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
            Settings
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure application-wide settings
          </p>
        </div>

        <div className="max-w-lg">
          <ComponentCard title="Volatility Monitor">
            <div className="space-y-4">
              <div>
                <Label htmlFor="multiplier">
                  Alert Multiplier
                  <span className="ml-1.5 text-xs text-gray-400 font-normal">
                    (threshold = multiplier × avg volatility)
                  </span>
                </Label>
                <Input
                  type="number"
                  id="multiplier"
                  value={multiplier}
                  onChange={(e) => setMultiplier(e.target.value)}
                  step={0.1}
                  min="0.1"
                  placeholder="e.g. 3"
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  Current value: <span className="font-medium text-gray-700 dark:text-gray-300">{multiplier}</span>
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Button onClick={handleSave} disabled={submitting}>
                  {submitting ? "Saving..." : "Save"}
                </Button>
                {success && (
                  <span className="text-sm text-success-500 font-medium">
                    Saved successfully
                  </span>
                )}
              </div>
            </div>
          </ComponentCard>
        </div>
      </div>
    </>
  );
}

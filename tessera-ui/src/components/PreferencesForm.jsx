// src/components/PreferencesForm.jsx
import { useState, useEffect } from "react";

const DAY_OPTIONS = [
  { code: "M", label: "Mon" },
  { code: "T", label: "Tue" },
  { code: "W", label: "Wed" },
  { code: "Th", label: "Thu" },
  { code: "F", label: "Fri" },
];

const TIME_OPTIONS = [
  "",        // no preference
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
];

export default function PreferencesForm({ value, onChange }) {
  // local state mirrors parent value but updates via onChange
  const [prefs, setPrefs] = useState(
    value || {
      earliest_start: "",
      avoid_days: [],
      max_classes_per_day: "",
      preferred_time: "",
    }
  );

  useEffect(() => {
    onChange?.(prefs);
  }, [prefs, onChange]);

  const toggleDay = (code) => {
    setPrefs((prev) => {
      const set = new Set(prev.avoid_days || []);
      if (set.has(code)) set.delete(code);
      else set.add(code);
      return { ...prev, avoid_days: Array.from(set) };
    });
  };

  return (
    <div className="border rounded-xl p-4 mb-4 bg-gray-50">
      <h3 className="font-semibold text-lg mb-2 text-indigo-700">
        Preferences
      </h3>
      <p className="text-xs text-gray-600 mb-3">
        Use these options to tailor the generated schedule. Leave fields empty
        if you have no preference.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        {/* earliest start */}
        <div>
          <label className="block mb-1 font-medium">
            Earliest class start
          </label>
          <select
            className="border rounded px-2 py-1 w-full"
            value={prefs.earliest_start}
            onChange={(e) =>
              setPrefs((p) => ({ ...p, earliest_start: e.target.value }))
            }
          >
            <option value="">No preference</option>
            {TIME_OPTIONS.filter(Boolean).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* max classes per day */}
        <div>
          <label className="block mb-1 font-medium">
            Max classes per day
          </label>
          <input
            type="number"
            min="1"
            max="6"
            className="border rounded px-2 py-1 w-full"
            value={prefs.max_classes_per_day}
            onChange={(e) =>
              setPrefs((p) => ({ ...p, max_classes_per_day: e.target.value }))
            }
            placeholder="No preference"
          />
        </div>

        {/* avoid days */}
        <div>
          <label className="block mb-1 font-medium">
            Avoid these days
          </label>
          <div className="flex flex-wrap gap-2">
            {DAY_OPTIONS.map((d) => (
              <label
                key={d.code}
                className="text-xs flex items-center gap-1 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={prefs.avoid_days?.includes(d.code) || false}
                  onChange={() => toggleDay(d.code)}
                />
                {d.label}
              </label>
            ))}
          </div>
        </div>

        {/* preferred time of day */}
        <div>
          <label className="block mb-1 font-medium">
            Preferred time of day
          </label>
          <select
            className="border rounded px-2 py-1 w-full"
            value={prefs.preferred_time}
            onChange={(e) =>
              setPrefs((p) => ({ ...p, preferred_time: e.target.value }))
            }
          >
            <option value="">No preference</option>
            <option value="morning">Morning (8–12)</option>
            <option value="afternoon">Afternoon (12–4)</option>
            <option value="evening">Evening (4–8)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
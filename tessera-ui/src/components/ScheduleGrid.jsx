// src/components/ScheduleGrid.jsx
import React from "react";

// days order for nice display
const DAY_ORDER = ["M", "T", "W", "Th", "F"];

function normalizeDays(d) {
  if (Array.isArray(d)) return d;
  if (!d) return [];
  // server might send "M,W,F" or "['M','W']"
  try {
    const parsed = JSON.parse(d);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return String(d)
    .split(",")
    .map(x => x.trim())
    .filter(Boolean);
}

function sortDays(days) {
  const set = new Set(days);
  return DAY_ORDER.filter(d => set.has(d));
}

export default function ScheduleGrid({ schedules }) {
  if (!schedules || schedules.length === 0) {
    return <p className="text-gray-600">No valid schedules yet.</p>;
  }

  return (
    <div className="space-y-6 mt-6">
      {/* header summary */}
      <div className="text-sm text-gray-700">
        Found <span className="font-semibold">{schedules.length}</span>{" "}
        valid schedule{schedules.length !== 1 ? "s" : ""} 🎉
      </div>

      {schedules.map((sched, i) => (
        <div key={i} className="border rounded-xl shadow-sm bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-indigo-600">
              Schedule {i + 1} — {sched.total_credits} credits
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead className="bg-indigo-100 text-gray-800">
                <tr>
                  <th className="px-3 py-2 border text-left">Course</th>
                  <th className="px-3 py-2 border text-left">Section</th>
                  <th className="px-3 py-2 border text-left">Instructor</th>
                  <th className="px-3 py-2 border text-left">Days</th>
                  <th className="px-3 py-2 border text-left">Time</th>
                </tr>
              </thead>
              <tbody>
                {sched.sections.map((s) => {
                  const days = sortDays(normalizeDays(s.days));
                  return (
                    <tr key={s.id} className="hover:bg-indigo-50">
                      <td className="px-3 py-2 border">{s.course?.code}</td>
                      <td className="px-3 py-2 border">{s.section_number}</td>
                      <td className="px-3 py-2 border">{s.instructor || "—"}</td>
                      <td className="px-3 py-2 border">{days.join(", ") || "—"}</td>
                      <td className="px-3 py-2 border">
                        {s.start_time} – {s.end_time}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
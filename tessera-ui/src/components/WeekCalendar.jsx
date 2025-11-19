import React from "react";

const DAYS = [
  { code: "M", label: "Mon" },
  { code: "T", label: "Tue" },
  { code: "W", label: "Wed" },
  { code: "Th", label: "Thu" },
  { code: "F", label: "Fri" },
];

const START_HOUR = 8;
const END_HOUR = 18;
const HOUR_HEIGHT = 50;
const PX_PER_MIN = HOUR_HEIGHT / 60;

function parseTimeToMinutes(t) {
  if (!t) return null;
  const parts = t.split(":").map(Number);
  const [h, m] = parts;
  return h * 60 + (m || 0);
}

function normalizeDays(days) {
  if (!days) return [];
  if (Array.isArray(days)) return days;

  // try JSON-like string
  try {
    const parsed = JSON.parse(days);
    if (Array.isArray(parsed)) return parsed;
  } catch {

  }

  return String(days)
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);
}

export default function WeekCalendar({ schedule }) {
  if (!schedule || !schedule.sections || schedule.sections.length === 0) {
    return (
      <p className="text-gray-600 mt-4">
        No schedule selected for calendar view.
      </p>
    );
  }

  const containerHeight =
    (END_HOUR - START_HOUR) * 60 * PX_PER_MIN;

  const hours = [];
  for (let h = START_HOUR; h <= END_HOUR; h++) {
    hours.push(h);
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-2">
        Weekly Calendar View{" "}
        <span className="text-indigo-600 text-base">
          ({schedule.total_credits} credits)
        </span>
      </h2>

      <div className="flex border rounded-xl bg-white overflow-hidden">
        {/* Time column */}
        <div
          className="w-16 border-r relative bg-gray-50"
          style={{ height: `${containerHeight}px` }}
        >
          {hours.map((h) => (
            <div
              key={h}
              className="absolute left-0 w-full border-t border-gray-200 text-[10px] text-gray-500 pr-1 text-right"
              style={{
                top: `${(h - START_HOUR) * 60 * PX_PER_MIN}px`,
              }}
            >
              {h.toString().padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {/* Day columns */}
        {DAYS.map((day) => (
          <div
            key={day.code}
            className="flex-1 border-r last:border-r-0 relative"
            style={{ height: `${containerHeight}px` }}
          >
            {/* Day header */}
            <div className="sticky top-0 z-10 bg-gray-100 text-center text-xs font-semibold border-b border-gray-200 py-1">
              {day.label}
            </div>

            {/* Background hour lines */}
            {hours.map((h) => (
              <div
                key={h}
                className="absolute left-0 w-full border-t border-gray-100"
                style={{
                  top: `${(h - START_HOUR) * 60 * PX_PER_MIN}px`,
                }}
              />
            ))}

            {/* Section blocks */}
            {schedule.sections
              .filter((sec) =>
                normalizeDays(sec.days).includes(day.code)
              )
              .map((sec) => {
                const startMin = parseTimeToMinutes(sec.start_time);
                const endMin = parseTimeToMinutes(sec.end_time);
                if (
                  startMin == null ||
                  endMin == null ||
                  endMin <= startMin
                ) {
                  return null;
                }

                const top =
                  (startMin - START_HOUR * 60) * PX_PER_MIN;
                const height =
                  (endMin - startMin) * PX_PER_MIN;

                if (height <= 0) return null;

                return (
                  <div
                    key={sec.id + "-" + day.code}
                    className="absolute left-1 right-1 rounded-md bg-indigo-500/90 text-white text-[10px] px-1 py-0.5 shadow-sm overflow-hidden"
                    style={{
                      top: `${top}px`,
                      height: `${height}px`,
                    }}
                  >
                    <div className="font-semibold truncate">
                      {sec.course?.code}-{sec.section_number}
                    </div>
                    <div className="text-[9px] truncate">
                      {sec.start_time}–{sec.end_time}
                    </div>
                    {sec.instructor && (
                      <div className="text-[9px] truncate">
                        {sec.instructor}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        ))}
      </div>
    </div>
  );
}
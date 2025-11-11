import { useEffect, useState } from "react";

export default function App() {
  const [courses, setCourses] = useState([]);
  const [selected, setSelected] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);

  // fetch courses on load
  useEffect(() => {
    fetch("/api/courses/")       // thanks to Vite proxy
      .then((r) => r.json())
      .then(setCourses)
      .catch((e) => console.error("Courses fetch failed:", e));
  }, []);

  const toggle = (id) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const generate = () => {
    setLoading(true);
    fetch("/api/generate-schedules/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selected_courses: selected }),
    })
      .then((r) => r.json())
      .then(setSchedules)
      .catch((e) => console.error("Generate failed:", e))
      .finally(() => setLoading(false));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow p-6">
        <h1 className="text-3xl font-bold text-indigo-600 mb-6 text-center">
          Tessera Schedule Planner
        </h1>

        <h2 className="text-xl font-semibold mb-3">Select Courses</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
          {courses.map((c) => (
            <label
              key={c.id}
              className="flex items-center gap-2 p-2 border rounded-md hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={selected.includes(c.id)}
                onChange={() => toggle(c.id)}
              />
              <span>
                {c.code} — {c.title}{" "}
                <span className="text-gray-500">({c.credits} cr)</span>
              </span>
            </label>
          ))}
        </div>

        <button
          onClick={generate}
          disabled={loading || selected.length === 0}
          className="bg-indigo-600 disabled:bg-indigo-300 text-white px-4 py-2 rounded-md"
        >
          {loading ? "Generating..." : "Generate Schedules"}
        </button>

        <h2 className="text-xl font-semibold mt-8 mb-3">Valid Schedules</h2>
        {schedules.length === 0 ? (
          <p className="text-gray-500">
            {loading ? "Working..." : "No schedules yet."}
          </p>
        ) : (
          <div className="space-y-4">
            {schedules.map((s, i) => (
              <div key={i} className="border rounded-lg p-4 bg-gray-50">
                <h3 className="text-lg font-semibold text-indigo-600">
                  Total Credits: {s.total_credits}
                </h3>
                <ul className="list-disc list-inside text-gray-700 mt-2">
                  {s.sections.map((sec) => (
                    <li key={sec.id}>
                      {sec.course.code}-{sec.section_number} |{" "}
                      {Array.isArray(sec.days) ? sec.days.join(", ") : sec.days} |{" "}
                      {sec.start_time}–{sec.end_time}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

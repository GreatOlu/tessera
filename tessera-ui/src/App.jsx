import { useEffect, useState } from "react";
import CourseForm from "./components/CourseForm.jsx";
import SectionForm from "./components/SectionForm.jsx";
import WeekCalendar from "./components/WeekCalendar.jsx";
import PreferencesForm from "./components/PreferencesForm.jsx";

export default function App() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selected, setSelected] = useState(() => {
    try {
      const saved = localStorage.getItem("selectedCourses");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [schedules, setSchedules] = useState(() => {
    try {
      const saved = localStorage.getItem("lastSchedules");
      return saved ? JSON.parse(saved).items : [];
    } catch {
      return [];
    }
  });

  const [generatedAt, setGeneratedAt] = useState(() => {
    try {
      const saved = localStorage.getItem("lastSchedules");
      return saved ? JSON.parse(saved).generatedAt : null;
    } catch {
      return null;
    }
  });

  const [preferences, setPreferences] = useState({
    earliest_start: "",
    avoid_days: [],
    max_classes_per_day: "",
    preferred_time: "",
  });

  const [error, setError] = useState("");

  // --- data fetching ---

  const fetchCourses = () => {
    fetch("/api/courses/")
      .then((r) => r.json())
      .then(setCourses)
      .catch((e) => console.error("Courses fetch failed:", e));
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // --- persistence ---

  useEffect(() => {
    localStorage.setItem("selectedCourses", JSON.stringify(selected));
  }, [selected]);

  useEffect(() => {
    if (schedules && schedules.length > 0) {
      localStorage.setItem(
        "lastSchedules",
        JSON.stringify({
          generatedAt: new Date().toISOString(),
          items: schedules,
        })
      );
    } else {
      localStorage.removeItem("lastSchedules");
    }
  }, [schedules]);

  // --- selection toggle ---

  const toggle = (id) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  // --- generate best schedule from backend ---

  const generate = () => {
    if (selected.length === 0) {
      setError("Please select at least one course before generating.");
      return;
    }

    setLoading(true);
    setError("");

    fetch("/api/generate-schedules/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        selected_courses: selected,
        preferences: preferences,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data && data.sections) {
          setSchedules([data]);
          setGeneratedAt(new Date().toISOString());
        } else {
          setSchedules([]);
          setGeneratedAt(null);
          setError(
            "No schedule could be generated with these preferences. Try relaxing one or two constraints."
          );
        }
      })
      .catch((e) => {
        console.error("Generate failed:", e);
        setSchedules([]);
        setGeneratedAt(null);
        setError("Something went wrong while generating the schedule.");
      })
      .finally(() => setLoading(false));
  };

  const clearResults = () => {
    setSchedules([]);
    setGeneratedAt(null);
    setError("");
  };

  // --- render ---

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow p-6">
        <h1 className="text-3xl font-bold text-indigo-600 mb-6 text-center">
          Tessera Schedule Planner
        </h1>

        <CourseForm
          onCreated={() => {
            fetchCourses();
          }}
        />

        <SectionForm
          courses={courses}
          onCreated={(createdSection) => {
            // TODO: replace with toast/notification
            console.log("Section created:", createdSection);
          }}
        />

        <h2 className="text-xl font-semibold mb-3 mt-4">Select Courses</h2>
        {courses.length === 0 ? (
          <p className="text-sm text-gray-600 mb-4">
            No courses defined yet. Add courses above to get started.
          </p>
        ) : (
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
        )}

        <PreferencesForm
          value={preferences}
          onChange={(prefs) => setPreferences(prefs)}
        />

        <div className="mt-2 mb-4 flex items-center gap-3">
          <button
            onClick={generate}
            disabled={loading || selected.length === 0}
            className="bg-indigo-600 disabled:bg-indigo-300 text-white px-4 py-2 rounded-md"
          >
            {loading ? "Generating..." : "Generate Schedule"}
          </button>
          <button
            onClick={clearResults}
            className="text-sm text-gray-600 hover:text-gray-900 underline"
          >
            Clear results
          </button>
        </div>

        {error && (
          <div className="mt-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            Personalized Schedule
          </h2>

          {generatedAt && (
            <span className="text-sm text-gray-500">
              Last generated: {new Date(generatedAt).toLocaleString()}
            </span>
          )}
        </div>

        {schedules.length === 0 && !loading && !error && (
          <p className="mt-3 text-sm text-gray-600">
            No schedule yet. Select courses, adjust your preferences, and click{" "}
            <span className="font-medium">Generate Schedule</span>.
          </p>
        )}

        {schedules.length > 0 && (
          <WeekCalendar schedule={schedules[0]} />
        )}
      </div>
    </div>
  );
}
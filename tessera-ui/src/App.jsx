import { useEffect, useState } from "react";
import CourseForm from "./components/CourseForm.jsx";
import SectionForm from "./components/SectionForm.jsx";
import ScheduleGrid from "./components/ScheduleGrid.jsx";
import WeekCalendar from "./components/WeekCalendar.jsx";

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

  const fetchCourses = () => {
    fetch("/api/courses/")
      .then((r) => r.json())
      .then(setCourses)
      .catch((e) => console.error("Courses fetch failed:", e));
  };

  useEffect(() => {
    localStorage.setItem("selectedCourses", JSON.stringify(selected));
  }, [selected]);

  useEffect(() => {
    fetch("/api/courses/")
      .then((r) => r.json())
      .then(setCourses)
      .catch((e) => console.error("Courses fetch failed:", e));
  }, []);

  useEffect(() => {
    if (schedules && schedules.length > 0) {
      localStorage.setItem(
        "lastSchedules",
        JSON.stringify({ generatedAt: new Date().toISOString(), items: schedules })
      );
    } else {
      localStorage.removeItem("lastSchedules");
    }
  }, [schedules]);


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
      .then((data) => {
        setSchedules(data);
        setGeneratedAt(new Date().toISOString());
      })
      .catch((e) => console.error("Generate failed:", e))
      .finally(() => setLoading(false));
  };

  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow p-6">
        <h1 className="text-3xl font-bold text-indigo-600 mb-6 text-center">
          Tessera Schedule Planner
        </h1>

        <CourseForm
          onCreated={(createdCourse) => {
            fetchCourses();
          }}
        />

        <SectionForm
          courses={courses}
          onCreated={(createdSection) => {
            // TODO: use toast
            console.log("Section created:", createdSection);
          }}
        />

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
        <button
          onClick={() => { setSchedules([]); setGeneratedAt(null); }}
          className="ml-3 text-sm text-gray-600 hover:text-gray-900 underline"
        >
          Clear results
        </button>

        <div className="mt-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            Valid Schedules
            {schedules.length > 0 && (
              <span className="ml-2 text-indigo-600">
                — Found {schedules.length} schedule{schedules.length !== 1 ? "s" : ""} 🎉
              </span>
            )}
          </h2>

          {generatedAt && (
            <span className="text-sm text-gray-500">
              Last generated: {new Date(generatedAt).toLocaleString()}
            </span>
          )}
        </div>

        {schedules.length > 0 && (
          <WeekCalendar schedule={schedules[0]} />
        )}

        {schedules.length === 0 ? (
          <p className="text-gray-500">
            {loading ? "Working..." : "No schedules yet."}
          </p>
        ) : (
          <ScheduleGrid schedules={schedules} />
        )}
      </div>
    </div>
  );
}

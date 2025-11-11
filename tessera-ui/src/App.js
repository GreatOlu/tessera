import React, { useState, useEffect } from "react";

function App() {
  const [courses, setCourses] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [schedules, setSchedules] = useState([]);

  // Fetch courses from your Django API
  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/courses/")
      .then((res) => res.json())
      .then((data) => setCourses(data))
      .catch((err) => console.error("Error fetching courses:", err));
  }, []);

  const handleSelect = (courseId) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleGenerate = () => {
    fetch("http://127.0.0.1:8000/api/generate-schedules/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selected_courses: selectedCourses }),
    })
      .then((res) => res.json())
      .then((data) => setSchedules(data))
      .catch((err) => console.error("Error generating schedules:", err));
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1>Tessera Schedule Planner</h1>

      <h2>Select Courses</h2>
      {courses.map((course) => (
        <div key={course.id}>
          <input
            type="checkbox"
            checked={selectedCourses.includes(course.id)}
            onChange={() => handleSelect(course.id)}
          />
          {course.code} - {course.title} ({course.credits} credits)
        </div>
      ))}

      <button onClick={handleGenerate} style={{ marginTop: "1rem" }}>
        Generate Schedules
      </button>

      <h2 style={{ marginTop: "2rem" }}>Valid Schedules</h2>
      {schedules.length === 0 ? (
        <p>No schedules generated yet.</p>
      ) : (
        schedules.map((s, index) => (
          <div
            key={index}
            style={{
              border: "1px solid #ccc",
              padding: "1rem",
              marginBottom: "1rem",
            }}
          >
            <h3>Total Credits: {s.total_credits}</h3>
            <ul>
              {s.sections.map((sec) => (
                <li key={sec.id}>
                  {sec.course.code}-{sec.section_number} | {sec.days.join(", ")} |{" "}
                  {sec.start_time}–{sec.end_time}
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}

export default App;

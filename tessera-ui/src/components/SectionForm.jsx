// src/components/SectionForm.jsx
import { useState } from "react";

const DAY_OPTIONS = [
  { code: "M", label: "Mon" },
  { code: "T", label: "Tue" },
  { code: "W", label: "Wed" },
  { code: "Th", label: "Thu" },
  { code: "F", label: "Fri" },
];

export default function SectionForm({ courses, onCreated }) {
  const [courseId, setCourseId] = useState("");
  const [sectionNumber, setSectionNumber] = useState("");
  const [instructor, setInstructor] = useState("");
  const [days, setDays] = useState([]);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:15");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggleDay = (code) => {
    setDays((prev) =>
      prev.includes(code)
        ? prev.filter((d) => d !== code)
        : [...prev, code]
    );
  };

  const validate = () => {
    if (!courseId) {
      setError("Please select a course.");
      return false;
    }
    if (!sectionNumber.trim()) {
      setError("Please enter a section number.");
      return false;
    }
    if (days.length === 0) {
      setError("Please select at least one meeting day.");
      return false;
    }
    if (start >= end) {
      setError("Start time must be earlier than end time.");
      return false;
    }
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!validate()) return;

    setSaving(true);

    fetch("/api/sections/create/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        course_id: Number(courseId),
        section_number: sectionNumber,
        instructor,
        days,
        start_time: start,
        end_time: end,
      }),
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) {
          // DRF errors might be objects; flatten a bit
          const detail =
            typeof data === "string"
              ? data
              : data.detail ||
                JSON.stringify(data);
          throw new Error(detail);
        }
        onCreated?.(data);
        // reset
        setSectionNumber("");
        setInstructor("");
        setDays([]);
        setStart("09:00");
        setEnd("10:15");
        setError("");
      })
      .catch((e) => {
        console.error("Section create failed:", e);
        setError(e.message || "Failed to create section.");
      })
      .finally(() => setSaving(false));
  };

  const selectedCourse = courses.find(
    (c) => c.id === Number(courseId)
  );

  const dayLabelMap = DAY_OPTIONS.reduce((acc, d) => {
    acc[d.code] = d.label;
    return acc;
  }, {});

  const previewText =
    selectedCourse && sectionNumber && days.length > 0
      ? `${selectedCourse.code}-${sectionNumber} — ${days
          .map((d) => dayLabelMap[d] || d)
          .join(", ")} ${start}–${end}`
      : "";

  return (
    <form
      onSubmit={handleSubmit}
      className="border rounded-lg p-4 mb-4"
    >
      <h3 className="font-semibold mb-3">Add Section</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <select
          className="border rounded px-2 py-1"
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          required
        >
          <option value="">Select Course</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} — {c.title}
            </option>
          ))}
        </select>

        <input
          className="border rounded px-2 py-1"
          placeholder="Section # (e.g., 01)"
          value={sectionNumber}
          onChange={(e) => setSectionNumber(e.target.value)}
          required
        />

        <input
          className="border rounded px-2 py-1"
          placeholder="Instructor (optional)"
          value={instructor}
          onChange={(e) => setInstructor(e.target.value)}
        />

        <div className="flex flex-wrap gap-3 items-center">
          {DAY_OPTIONS.map((d) => (
            <label
              key={d.code}
              className="flex items-center gap-1 text-sm"
            >
              <input
                type="checkbox"
                checked={days.includes(d.code)}
                onChange={() => toggleDay(d.code)}
              />
              {d.label}
            </label>
          ))}
        </div>

        <input
          type="time"
          className="border rounded px-2 py-1"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          required
        />
        <input
          type="time"
          className="border rounded px-2 py-1"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          required
        />
      </div>

      {previewText && (
        <div className="mt-3 text-xs text-gray-700">
          <span className="font-semibold">Preview:</span>{" "}
          {previewText}
        </div>
      )}

      <div className="mt-3 flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="bg-indigo-600 text-white px-3 py-1 rounded text-sm"
        >
          {saving ? "Saving..." : "Create Section"}
        </button>
        {error && (
          <span className="text-xs text-red-600">{error}</span>
        )}
      </div>
    </form>
  );
}
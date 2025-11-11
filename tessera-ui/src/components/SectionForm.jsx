import { useState } from "react";

const DAY_OPTIONS = [
  { code: "M", label: "Mon" },
  { code: "T", label: "Tue" },
  { code: "W", label: "Wed" },
  { code: "Th", label: "Thu" },
  { code: "F", label: "Fri" },
];

export default function NewSectionForm({ courses, onCreated }) {
  const [courseId, setCourseId] = useState("");
  const [sectionNumber, setSectionNumber] = useState("");
  const [instructor, setInstructor] = useState("");
  const [days, setDays] = useState([]);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:15");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggleDay = (code) =>
    setDays((d) => (d.includes(code) ? d.filter(x => x !== code) : [...d, code]));

  const submit = (e) => {
    e.preventDefault();
    setSaving(true); setError("");
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
        if (!r.ok) throw new Error((await r.text()) || "Failed");
        return r.json();
      })
      .then((created) => {
        onCreated?.(created);
        // reset
        setCourseId("");
        setSectionNumber("");
        setInstructor("");
        setDays([]);
        setStart("09:00");
        setEnd("10:15");
      })
      .catch((e) => setError(String(e.message || e)))
      .finally(() => setSaving(false));
  };

  return (
    <form onSubmit={submit} className="border rounded-lg p-4 mb-4">
      <h3 className="font-semibold mb-3">Add Section</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <select className="border rounded px-2 py-1" value={courseId}
                onChange={(e)=>setCourseId(e.target.value)} required>
          <option value="">Select Course</option>
          {courses.map(c => (
            <option key={c.id} value={c.id}>
              {c.code} — {c.title}
            </option>
          ))}
        </select>

        <input className="border rounded px-2 py-1" placeholder="Section # (e.g., 01)"
               value={sectionNumber} onChange={(e)=>setSectionNumber(e.target.value)} required/>

        <input className="border rounded px-2 py-1" placeholder="Instructor"
               value={instructor} onChange={(e)=>setInstructor(e.target.value)} />

        <div className="flex flex-wrap gap-3 items-center">
          {DAY_OPTIONS.map(d => (
            <label key={d.code} className="flex items-center gap-1">
              <input type="checkbox"
                     checked={days.includes(d.code)}
                     onChange={()=>toggleDay(d.code)} />
              {d.label}
            </label>
          ))}
        </div>

        <input type="time" className="border rounded px-2 py-1"
               value={start} onChange={(e)=>setStart(e.target.value)} required/>
        <input type="time" className="border rounded px-2 py-1"
               value={end} onChange={(e)=>setEnd(e.target.value)} required/>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button disabled={saving} className="bg-indigo-600 text-white px-3 py-1 rounded">
          {saving ? "Saving..." : "Create Section"}
        </button>
        {error && <span className="text-red-600 text-sm">{error}</span>}
      </div>
    </form>
  );
}
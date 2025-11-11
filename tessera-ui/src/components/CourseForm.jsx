import { useState } from "react";

export default function CourseForm({ onCreated }) {
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [credits, setCredits] = useState(3);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    setSaving(true); setError("");
    fetch("/api/courses/create/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, title, credits: Number(credits) }),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.text()) || "Failed");
        return r.json();
      })
      .then((created) => {
        onCreated?.(created);
        setCode(""); setTitle(""); setCredits(3);
      })
      .catch((e) => setError(String(e.message || e)))
      .finally(() => setSaving(false));
  };

  return (
    <form onSubmit={submit} className="border rounded-lg p-4 mb-4">
      <h3 className="font-semibold mb-3">Add Course</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input className="border rounded px-2 py-1" placeholder="Code (CSCI-210)"
               value={code} onChange={(e)=>setCode(e.target.value)} required />
        <input className="border rounded px-2 py-1" placeholder="Title"
               value={title} onChange={(e)=>setTitle(e.target.value)} required />
        <input className="border rounded px-2 py-1" type="number" min="1" max="6"
               value={credits} onChange={(e)=>setCredits(e.target.value)} required />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button disabled={saving} className="bg-indigo-600 text-white px-3 py-1 rounded">
          {saving ? "Saving..." : "Create Course"}
        </button>
        {error && <span className="text-red-600 text-sm">{error}</span>}
      </div>
    </form>
  );
}
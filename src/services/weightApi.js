// src/services/weightApi.js
// Talks to the Express server (server.js) which stores data in server/data/weight.xlsx

const API_URL = "http://localhost:5000/api/weight";

/**
 * Fetch all weight records from the Excel file.
 * Returns an array sorted by date (oldest first).
 */
export async function fetchWeights() {
  const res = await fetch(API_URL);
  if (!res.ok) {
    throw new Error(`GET /api/weight failed: ${res.status}`);
  }
  const json = await res.json();
  if (json.result !== "success") {
    throw new Error(json.error || "Unknown server error");
  }

  // Server returns string values from Excel — coerce numbers back to numbers
  const numericFields = [
    "weight", "waist", "neck", "hip",
    "bmi", "bodyFat", "muscleMass", "idealWeight", "healthyMin", "healthyMax",
  ];

  const rows = (json.data || []).map((r) => {
    const out = { ...r };
    numericFields.forEach((f) => {
      if (out[f] === "" || out[f] == null) {
        out[f] = null;
      } else {
        const n = Number(out[f]);
        out[f] = Number.isFinite(n) ? n : null;
      }
    });
    // id must stay unique + stable for React keys / delete calls
    if (out.id != null) out.id = String(out.id);
    return out;
  });

  // Sort oldest → newest so Three.jsx's records[records.length-1] = latest works
  rows.sort((a, b) => new Date(a.date) - new Date(b.date));
  return rows;
}

/**
 * Save (or update) one weight record.
 * Server upserts by `date`, so re-saving the same day overwrites it.
 */
export async function saveWeight(record) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
  });
  if (!res.ok) {
    throw new Error(`POST /api/weight failed: ${res.status}`);
  }
  const json = await res.json();
  if (json.result !== "success") {
    throw new Error(json.error || "Unknown server error");
  }
  return json;
}

/**
 * Delete one record by its id.
 */
export async function deleteWeight(id) {
  const res = await fetch(`${API_URL}/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error(`DELETE /api/weight failed: ${res.status}`);
  }
  const json = await res.json();
  if (json.result !== "success") {
    throw new Error(json.error || "Unknown server error");
  }
  return json;
}
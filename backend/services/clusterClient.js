const DEFAULT_SEEDS = [
  "http://localhost:7101",
  "http://localhost:7102",
  "http://localhost:7103",
  "http://localhost:7104",
  "http://localhost:7105",
];

const SEEDS = (process.env.CLUSTER_SEEDS || DEFAULT_SEEDS.join(","))
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

async function getStatus(baseUrl) {
  const res = await fetch(`${baseUrl}/admin/status`);
  if (!res.ok) throw new Error(`status ${res.status}`);
  return res.json();
}

async function findLeader() {
  for (const seed of SEEDS) {
    try {
      const st = await getStatus(seed);
      if (st.role === 2) return seed; // leader
    } catch {}
  }
  // fallback: still return first seed
  return SEEDS[0];
}

async function sendClientCommand(userId, seq, command) {
  let target = await findLeader();

  for (let i = 0; i < 6; i++) {
    const res = await fetch(`${target}/client/command`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, seq, command }),
    });

    const json = await res.json();

    // followers should redirect
    if (!json.ok && json.redirect_to && json.leader_url) {
      target = json.leader_url;
      continue;
    }

    return json;
  }

  return { ok: false, error: "could not reach leader after retries" };
}

// ✅ READS go to leader too (fix disappearing notes on refresh)
async function fetchNotes(userId) {
  const leader = await findLeader();
  const res = await fetch(`${leader}/client/notes?user_id=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error(`notes ${res.status}`);
  return res.json();
}

async function fetchStatuses() {
  const out = [];
  for (const seed of SEEDS) {
    try {
      const st = await getStatus(seed);
      out.push({ seed, ...st });
    } catch (e) {
      out.push({ seed, error: e.message });
    }
  }
  return out;
}

module.exports = { sendClientCommand, fetchNotes, fetchStatuses };

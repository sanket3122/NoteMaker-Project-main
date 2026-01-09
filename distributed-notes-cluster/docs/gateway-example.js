// Gateway idea (your existing Express backend):
// - keep JWT auth
// - convert writes into cluster commands
// - follow redirects to leader

const CLUSTER_SEEDS = process.env.CLUSTER_SEEDS?.split(",") ?? [
  "http://localhost:7101",
  "http://localhost:7102",
  "http://localhost:7103",
];

async function sendToCluster(body) {
  let target = CLUSTER_SEEDS[0];

  for (let i = 0; i < 5; i++) {
    const res = await fetch(`${target}/client/command`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      redirect: "manual"
    });

    const json = await res.json();

    if (json.redirect && json.leader_url) {
      target = json.leader_url;
      continue;
    }
    return json;
  }

  return { ok: false, error: "could not find leader" };
}

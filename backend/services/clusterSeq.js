// services/clusterSeq.js
const mongoose = require("mongoose");

const ClusterSeqSchema = new mongoose.Schema({
  userId: { type: String, unique: true },
  seq: { type: Number, default: 0 },
}, { collection: "cluster_seqs" });

const ClusterSeq = mongoose.models.ClusterSeq || mongoose.model("ClusterSeq", ClusterSeqSchema);

async function nextSeq(userId) {
  const doc = await ClusterSeq.findOneAndUpdate(
    { userId },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return doc.seq;
}

module.exports = { nextSeq };

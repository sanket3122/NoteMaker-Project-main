const mongoose = require("mongoose");

const ClusterSeqSchema = new mongoose.Schema({
  _id: { type: String, required: true },   // userId
  seq: { type: Number, default: 0 },
}, { versionKey: false });

module.exports = mongoose.model("cluster_seq", ClusterSeqSchema);

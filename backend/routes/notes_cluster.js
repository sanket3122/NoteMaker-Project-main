const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const crypto = require("crypto");

const fetchUser = require("../middleware/fetchUser");
const { nextSeq } = require("../services/clusterSeq");
const { sendClientCommand, fetchNotes, fetchStatuses } = require("../services/clusterClient");

// Cluster visibility
router.get("/cluster/status", async (req, res) => {
  const s = await fetchStatuses();
  res.json(s);
});

// ✅ fetch all notes (React calls this)
router.get("/fetchAllNotes", fetchUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const data = await fetchNotes(userId);

    if (!data || data.ok !== true || !Array.isArray(data.notes)) {
      return res.status(502).json({ error: "cluster read failed", details: data });
    }

    const notes = data.notes.map((n) => ({
      _id: n.note_id,
      title: n.title,
      description: n.description,
      tag: n.tag || "default",
      user: userId,
      date: n.updated_at || new Date().toISOString(),
    }));

    res.json(notes);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
});

// ✅ add note
router.post(
  "/addnotes",
  fetchUser,
  [
    body("title", "Enter a valid title").isLength({ min: 1 }),
    body("description", "Description must be at least 1 char").isLength({ min: 1 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const userId = req.user.id;
      const { title, description, tag } = req.body;

      const noteId = crypto.randomUUID();
      const seq = await nextSeq(userId);

      const command = {
        type: "NOTE_CREATE",
        user_id: userId,
        note_id: noteId,
        title,
        description,
        tag: tag || "default",
      };

      const reply = await sendClientCommand(userId, seq, command);
      if (!reply || reply.ok !== true) {
        return res.status(502).json({ error: "cluster write failed", details: reply });
      }

      res.json({
        _id: noteId,
        title,
        description,
        tag: tag || "default",
        user: userId,
        date: new Date().toISOString(),
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal server error");
    }
  }
);

// ✅ update note
router.put("/updatenote/:id", fetchUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const noteId = req.params.id;
    const { title, description, tag } = req.body;

    const seq = await nextSeq(userId);
    const command = {
      type: "NOTE_UPDATE",
      user_id: userId,
      note_id: noteId,
      title: title || "",
      description: description || "",
      tag: tag || "",
    };

    const reply = await sendClientCommand(userId, seq, command);
    if (!reply || reply.ok !== true) {
      return res.status(502).json({ success: false, error: "cluster update failed", details: reply });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
});

// ✅ delete note
router.delete("/deletenote/:id", fetchUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const noteId = req.params.id;

    const seq = await nextSeq(userId);
    const command = {
      type: "NOTE_DELETE",
      user_id: userId,
      note_id: noteId,
    };

    const reply = await sendClientCommand(userId, seq, command);
    if (!reply || reply.ok !== true) {
      return res.status(502).json({ success: false, error: "cluster delete failed", details: reply });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
});

module.exports = router;

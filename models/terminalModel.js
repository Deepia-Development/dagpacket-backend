const mongoose = require("mongoose");

const TerminalSchema = new mongoose.Schema({
  id: { type: String, required: true },
  password: { type: String, required: true },
  sn: { type: String, required: true },
  locker_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lockers",
    required: false, // Terminal puede existir sin locker asignado
  },
  ip: { type: String, required: true },
});

module.exports = mongoose.model("terminal-olipay", TerminalSchema);
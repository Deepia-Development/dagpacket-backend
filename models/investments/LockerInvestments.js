const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LockerInvestmentsSchema = new Schema({
  locker_id: { type: Schema.Types.ObjectId, ref: "Lockers", required: true }, // Referencia a la colección "lockers"
  user_id: { type: Schema.Types.ObjectId, ref: "Users", required: true }, // Referencia a la colección "users"
  amount: { type: Schema.Types.Decimal128, required: true },
});

const LockerInvestments = mongoose.model("LockerInvestments", LockerInvestmentsSchema);
module.exports = LockerInvestments;

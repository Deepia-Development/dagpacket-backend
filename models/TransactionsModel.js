// models/TransactionModel.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TransactionModel = new Schema(
  {
    user_id: { type: mongoose.Types.ObjectId, ref: "Users" },
    sub_user_id: { type: mongoose.Types.ObjectId, ref: "Users" },
    locker_id: { type: mongoose.Types.ObjectId, ref: "lockers" },
    shipment_ids: [{ type: mongoose.Types.ObjectId, ref: "Shipments" }],
    service: { type: String, required: true },
    emida_details: { type: String, required: false },
    comments: { type: String, required: false },
    reference_number: { type: String, required: false },
    emida_code: { type: String, required: false },
    transaction_number: { type: String, required: true },
    number_transactions: { type: String, required: false },
    payment_method: { type: String, required: true },
    previous_balance: { type: Schema.Types.Decimal128, required: false },
    new_balance: { type: Schema.Types.Decimal128, required: false },
    amount: { type: Schema.Types.Decimal128, required: true },
    details: { type: String },
    dagpacket_commission: { type: Schema.Types.Decimal128 },
    cash_register_id: { type: mongoose.Types.ObjectId, ref: "CashRegister" },
    employee_id: { type: mongoose.Types.ObjectId, ref: "Employee" },
    status: {
      type: String,
      enum: [
        "Pagado",
        "Reembolsado",
        "Reembolsado con comision",
        "Reembolsado Completo",
      ],
    },
    transaction_date: { type: Date, default: Date.now },
    receipt: { type: Buffer, required: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", TransactionModel);

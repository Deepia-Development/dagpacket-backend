const moongose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const PackingTransactionModel = new moongose.Schema(
  {
    user_id: { type: moongose.Types.ObjectId, ref: "Users", required: true },
    sub_user_id: { type: moongose.Types.ObjectId, ref: "Users" },
    price: { type: Number, required: true },
    cost: { type: Number, required: true },
    utilitie_lic: { type: Number, required: true },
    utilitie_dag: { type: Number, required: true },
    packing_id: { type: moongose.Types.ObjectId, ref: "Packing" },
    date: { type: Date, default: Date.now },
    quantity: { type: Number, required: true },
    status: {
      type: String,
      enum: ["Pagado", "Reembolsado", "Reembolsado con comision"],
      default: "Pagado",
    },
    transaction_date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
PackingTransactionModel.plugin(mongoosePaginate);
module.exports = moongose.model("PackingTransaction", PackingTransactionModel);

const mongoose = require("mongoose");
const { Schema } = mongoose;

const CuponModel = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ["Cupon Dagpacket", "Cupon Licenciatario", "Cupon Compuesto"],
  },
  type_value: {
    type: String,
    required: true,
    enum: ["Porcentaje", "Numero"],
  },
  value: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: function () {
      // Es requerido si no es ilimitado
      return !this.is_unlimited;
    },
  },
  is_unlimited: {
    type: Boolean,
    required: true,
    default: false, // Por defecto, no es ilimitado
  },
  start_date: {
    type: Date,
    required: true,
  },
  end_date: {
    type: Date,
    required: true,
  },
  status: {
    type: Boolean,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
});

// Validación personalizada
CuponModel.pre("save", function (next) {
  if (this.is_unlimited && this.quantity) {
    return next(
      new Error("Un cupón ilimitado no puede tener una cantidad especificada.")
    );
  }
  next();
});

module.exports = mongoose.model("Cupon", CuponModel);   

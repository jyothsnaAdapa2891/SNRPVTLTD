import mongoose, { Schema, model, models } from "mongoose";

/** _id is "{block}-{flatNo}" (e.g. "F-805"), not an auto-generated ObjectId. */
const VacantPlotSchema = new Schema(
  {
    _id: { type: String, required: true },
    block: { type: String, required: true },
    flatNo: { type: String, required: true },
    extentSft: { type: Number, required: true },
    facing: { type: String, required: true },
    corner: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["Available", "Sold", "Reserved", "Mortgaged"],
      default: "Available",
    },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false, versionKey: false },
);

export const VacantPlotModel =
  (models.VacantPlot as mongoose.Model<mongoose.InferSchemaType<typeof VacantPlotSchema>>) ||
  model("VacantPlot", VacantPlotSchema);

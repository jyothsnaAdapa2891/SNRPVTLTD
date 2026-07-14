import mongoose, { Schema, model, models } from "mongoose";

/** _id is the username. Passwords are stored hashed, never in plain text. */
const AdminSchema = new Schema(
  {
    _id: { type: String, required: true }, // username
    passwordHash: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false, versionKey: false },
);

export const AdminModel =
  (models.Admin as mongoose.Model<mongoose.InferSchemaType<typeof AdminSchema>>) ||
  model("Admin", AdminSchema);

import mongoose from "mongoose";

const SavedQuerySchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    query: { type: String, required: true, trim: true },
    oaOnly: { type: Boolean, default: false },
    // OpenAlex work IDs already seen/sent for this query, so the digest
    // only ever reports genuinely new results. Capped to the most recent
    // 500 to keep the document small.
    seenIds: { type: [String], default: [] },
    lastRunAt: { type: Date, default: null },
  },
  { timestamps: true }
);

SavedQuerySchema.index({ owner: 1, query: 1, oaOnly: 1 }, { unique: true });

export default mongoose.models.SavedQuery || mongoose.model("SavedQuery", SavedQuerySchema);

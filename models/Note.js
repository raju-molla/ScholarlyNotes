import mongoose from "mongoose";

const AuthorSchema = new mongoose.Schema(
  {
    firstName: { type: String, trim: true, default: "" },
    lastName: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const CitationSchema = new mongoose.Schema({
  key: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ["article", "book", "chapter", "website", "conference", "thesis", "report", "other"],
    default: "article",
  },
  authors: { type: [AuthorSchema], default: [] },
  title: { type: String, required: true, trim: true },
  source: { type: String, trim: true, default: "" },
  year: { type: String, trim: true, default: "" },
  volume: { type: String, trim: true, default: "" },
  issue: { type: String, trim: true, default: "" },
  pages: { type: String, trim: true, default: "" },
  publisher: { type: String, trim: true, default: "" },
  doi: { type: String, trim: true, default: "" },
  url: { type: String, trim: true, default: "" },
});

const HistoryEntrySchema = new mongoose.Schema(
  { content: String, savedAt: { type: Date, default: Date.now } },
  { _id: false }
);

const FigureSchema = new mongoose.Schema(
  { caption: { type: String, default: "" }, src: { type: String, required: true } },
  { _id: false }
);

const NoteSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, default: "Untitled note" },
    tags: { type: [String], default: [] },
    project: { type: String, trim: true, default: "" },
    // Body written in Markdown. In-text citations use the syntax [@key]
    content: { type: String, default: "" },
    citationStyle: {
      type: String,
      enum: ["apa", "mla", "chicago", "harvard", "ieee", "vancouver"],
      default: "apa",
    },
    citations: { type: [CitationSchema], default: [] },
    // Last 20 snapshots of `content`, most recent last, for simple version history.
    history: { type: [HistoryEntrySchema], default: [] },
    // Images referenced from the body via "[Figure N: caption]" placeholders.
    figures: { type: [FigureSchema], default: [] },
  },
  { timestamps: true }
);

NoteSchema.index({ owner: 1, title: "text", content: "text", tags: "text" });

export default mongoose.models.Note || mongoose.model("Note", NoteSchema);

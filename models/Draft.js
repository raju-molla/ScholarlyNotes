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

// An ordered list of sections, replacing a fixed set of fields — the
// starting eight (Abstract..Conclusion, with Implementation) are seeded by
// lib/paperSections.js when a draft is created, but the user can add more
// (custom: true) or remove any of them from the editor.
const SectionEntrySchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    content: { type: String, default: "" },
    custom: { type: Boolean, default: false },
  },
  { _id: false }
);

const HistoryEntrySchema = new mongoose.Schema(
  { sections: { type: mongoose.Schema.Types.Mixed }, savedAt: { type: Date, default: Date.now } },
  { _id: false }
);

const FigureSchema = new mongoose.Schema(
  { caption: { type: String, default: "" }, src: { type: String, required: true } },
  { _id: false }
);

const DraftSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, default: "Untitled paper" },
    subtitle: { type: String, trim: true, default: "" },
    project: { type: String, trim: true, default: "" },
    tags: { type: [String], default: [] },
    // Optional submission target — surfaced as a countdown + progress bar
    // on the drafts list, useful when juggling several papers at once.
    targetVenue: { type: String, trim: true, default: "" },
    deadline: { type: Date, default: null },
    citationStyle: {
      type: String,
      enum: ["apa", "mla", "chicago", "harvard", "ieee", "vancouver"],
      default: "apa",
    },
    citations: { type: [CitationSchema], default: [] },
    sections: { type: [SectionEntrySchema], default: [] },
    // Optional target word count per section key, e.g. { introduction: 800 }.
    targets: { type: mongoose.Schema.Types.Mixed, default: {} },
    // Last 20 snapshots of `sections`, most recent last, for simple version history.
    history: { type: [HistoryEntrySchema], default: [] },
    // Images referenced from any section via "[Figure N: caption]" placeholders,
    // numbered sequentially across the whole paper (like real figure numbering).
    figures: { type: [FigureSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.Draft || mongoose.model("Draft", DraftSchema);

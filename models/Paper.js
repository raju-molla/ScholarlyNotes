import mongoose from "mongoose";

const AuthorSchema = new mongoose.Schema(
  {
    firstName: { type: String, trim: true, default: "" },
    lastName: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const PaperSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    // Unique-per-user short key used everywhere as [@key] to cite this paper.
    key: { type: String, required: true, trim: true },

    type: {
      type: String,
      enum: ["article", "book", "chapter", "website", "conference", "thesis", "report", "other"],
      default: "article",
    },
    authors: { type: [AuthorSchema], default: [] },
    title: { type: String, required: true, trim: true },
    source: { type: String, trim: true, default: "" }, // journal / publisher / site name
    year: { type: String, trim: true, default: "" },
    volume: { type: String, trim: true, default: "" },
    issue: { type: String, trim: true, default: "" },
    pages: { type: String, trim: true, default: "" },
    publisher: { type: String, trim: true, default: "" },
    doi: { type: String, trim: true, default: "" },
    url: { type: String, trim: true, default: "" },
    fileUrl: { type: String, trim: true, default: "" }, // link to a hosted PDF (Drive, Zotero, S3, etc.)

    abstract: { type: String, default: "" },
    // AI-generated plain-language TL;DR of the abstract (see lib/ai.js) —
    // best-effort, never blocks saving the paper if generation fails.
    summary: { type: String, default: "" },
    // OpenAlex work ID (e.g. "W2741809807"), set when imported via
    // /discover — powers the "related papers" panel on this paper's page.
    openalexId: { type: String, trim: true, default: "" },
    tags: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["to-read", "reading", "read"],
      default: "to-read",
    },

    // The researcher's own reading notes / highlighted quotes for this paper (Markdown).
    myNotes: { type: String, default: "" },
  },
  { timestamps: true }
);

PaperSchema.index({ owner: 1, key: 1 }, { unique: true });
PaperSchema.index({ owner: 1, title: "text", abstract: "text", tags: "text", myNotes: "text" });

export default mongoose.models.Paper || mongoose.model("Paper", PaperSchema);

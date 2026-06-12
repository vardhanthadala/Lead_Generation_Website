import mongoose from "mongoose";

const LeadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    city: { type: String, required: true },
    address: { type: String },
    phone: { type: String },
    whatsapp: { type: String },
    email: { type: String },
    website: { type: String },
    rating: { type: Number },
    reviewsCount: { type: Number },
    lat: { type: Number },
    lng: { type: Number },
    photosCount: { type: Number },
    status: { type: String, enum: ["scraped", "audited", "contacted", "closed"], default: "scraped" },
  },
  { timestamps: true }
);

// Prevent re-compilation of model in development
export default mongoose.models.Lead || mongoose.model("Lead", LeadSchema);

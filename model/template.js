import mongoose from "mongoose";

const Schema = mongoose.Schema;

const templateschema = new Schema({
    name: { type: String, required: true },
    serviceType: {
        type: String,
        enum: ['SEO', 'Google Ads', 'Meta Ads', 'Social Media', 'Bundled'],
        required: true,
    },
    description: String,
    templateHtml: { type: String, required: true },
    defaultScope: String,
    defaultPricing: {
        monthlyFee: Number,
        setupFee: Number,
        currency: { type: String, default: 'USD' },
    },
    defaultTerms: String,
    // Explicitly reinforcing the schema type rules
    variables: [
        {
            key: { type: String },
            label: { type: String },
            type: { type: String },
            required: { type: Boolean },
        },
    ],
    createdBy: mongoose.Schema.Types.ObjectId,
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// FIX: If the model was compiled with a broken schema elsewhere, delete it from cache first
if (mongoose.models && mongoose.models.Template) {
    delete mongoose.models.Template;
}

export default mongoose.model("Template", templateschema);
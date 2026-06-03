import mongoose from "mongoose";

const Schema = mongoose.Schema;

const AgreementSchema = new Schema({
    _id: mongoose.Schema.Types.ObjectId,
    title: String,
    clientName: { type: String, required: true },
    clientEmail: { type: String, required: true },
    clientPhone: String,
    serviceType: {
        type: String,
        enum: ['SEO', 'Google Ads', 'Meta Ads', 'Social Media', 'Bundled'],
        required: true,
    },
    templateId: mongoose.Schema.Types.ObjectId,
    scope: { type: String, required: true },
    pricing: {
        monthlyFee: Number,
        setupFee: { type: Number, default: 0 },
        otherCharges: { type: Number, default: 0 },
        currency: { type: String, default: 'USD' },
    },
    terms: String,
    status: {
        type: String,
        enum: [
            'draft',
            'pending_manager_review',
            'manager_rejected',
            'approved_by_manager',
            'sent_to_client',
            'sent_to_sales_rep',
            'signed_by_client',
            'signed_by_sales_rep',
            'fully_signed',
            'archived',
        ],
        default: 'draft',
    },
    agreementType: {
        type: String,
        enum: ['new', 'renewal', 'amendment'],
        default: 'new',
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, required: true },
    createdAt: { type: Date, default: Date.now },
    submittedToManager: mongoose.Schema.Types.ObjectId,
    submittedAt: Date,
    approvedBy: mongoose.Schema.Types.ObjectId,
    approvedAt: Date,
    rejectionReason: String,
    clientSignature: {
        signedAt: Date,
        signatureUrl: String,
        ipAddress: String,
        emailSentAt: Date,
        viewedAt: Date,
    },
    salesRepSignature: {
        signedAt: Date,
        signatureUrl: String,
        ipAddress: String,
        emailSentAt: Date,
    },
    pdfUrl: String,
    signatureLink: String,
    ghlContactId: String,
    ghlDealId: String,
    ghlDocumentId: String,
    renewalDate: Date,
    parentAgreementId: mongoose.Schema.Types.ObjectId,
    comments: [
        {
            userId: mongoose.Schema.Types.ObjectId,
            userName: String,
            comment: String,
            createdAt: { type: Date, default: Date.now },
        },
    ],
    updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Agreement", AgreementSchema);
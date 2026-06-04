import AgreementModel from "../model/agreement.js";
import mongoose from "mongoose";
import axios from "axios";

// Helper function to map frontend template names to your schema's serviceType enum
const determineServiceType = (templateName) => {
    if (!templateName) return 'Bundled';
    const name = templateName.toLowerCase();
    if (name.includes('seo')) return 'SEO';
    if (name.includes('google ads') || name.includes('ppc')) return 'Google Ads';
    if (name.includes('meta ads') || name.includes('facebook')) return 'Meta Ads';
    if (name.includes('social media')) return 'Social Media';
    return 'Bundled';
};

export const updateAgreementDetails = async (req, res) => {
    try {
        const { agreement_id } = req.params; // Can be a Template ID (on create) or Agreement ID (on edit)
        const {
            clientName,
            clientEmail,
            clientPhone,
            scope,
            pricing,
            terms,
            templateId,
            templateName, // Pass or infer from your frontend state if possible
            createdBy
        } = req.body;

        let agreement = null;

        // 1. Determine if this is an update to an existing agreement
        if (mongoose.Types.ObjectId.isValid(agreement_id)) {
            agreement = await AgreementModel.findById(agreement_id);
        }

        // 2. Create or Update local document using your specific schema fields
        if (!agreement) {
            // Resolve required schema validation items
            const resolvedServiceType = determineServiceType(templateName || req.body.name);

            // Handle required 'createdBy' field safely (checks body, auth middleware, or falls back to a temporary valid ID)
            const resolvedCreatedBy = createdBy || req.user?._id || new mongoose.Types.ObjectId();

            agreement = new AgreementModel({
                _id: new mongoose.Types.ObjectId(),
                title: `${clientName} - ${resolvedServiceType} Agreement`,
                clientName,
                clientEmail,
                clientPhone: clientPhone || "",
                serviceType: resolvedServiceType,
                scope,
                pricing: {
                    monthlyFee: pricing?.monthlyFee || 0,
                    setupFee: pricing?.setupFee || 0,
                    currency: pricing?.currency || 'USD'
                },
                terms,
                status: 'draft',
                agreementType: 'new',
                createdBy: resolvedCreatedBy
            });

            // Prevent Mongo Cast Error: Save templateId ONLY if it's a valid Mongo ObjectId
            // (GHL templates pass string IDs which would cause a database validation failure)
            if (templateId && mongoose.Types.ObjectId.isValid(templateId)) {
                agreement.templateId = templateId;
            }
        } else {
            // Modify properties submitted from the active Modal adjustment form
            agreement.clientName = clientName || agreement.clientName;
            agreement.clientEmail = clientEmail || agreement.clientEmail;
            agreement.clientPhone = clientPhone !== undefined ? clientPhone : agreement.clientPhone;
            agreement.scope = scope !== undefined ? scope : agreement.scope;
            agreement.terms = terms !== undefined ? terms : agreement.terms;

            if (pricing) {
                agreement.pricing = {
                    ...agreement.pricing,
                    monthlyFee: pricing.monthlyFee !== undefined ? pricing.monthlyFee : agreement.pricing.monthlyFee,
                    setupFee: pricing.setupFee !== undefined ? pricing.setupFee : agreement.pricing.setupFee
                };
            }
            agreement.updatedAt = Date.now();
        }

        // 3. Synchronize document details outward to GoHighLevel (GHL)
        const GHL_API_KEY = process.env.GHL_API_KEY;
        const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;
        const GHL_BASE_URL = process.env.GHL_BASE_URL || 'https://services.leadconnectorhq.com/v1';

        try {
            // Use ghlDocumentId from your schema to determine whether to run POST or PUT
            const ghlEndpoint = agreement.ghlDocumentId
                ? `${GHL_BASE_URL}/proposals/${agreement.ghlDocumentId}`
                : `${GHL_BASE_URL}/proposals`;

            const ghlMethod = agreement.ghlDocumentId ? 'put' : 'post';

            const ghlResponse = await axios({
                method: ghlMethod,
                url: ghlEndpoint,
                headers: {
                    'Authorization': `Bearer ${GHL_API_KEY}`,
                    'Version': '2023-02-21',
                    'Content-Type': 'application/json'
                },
                data: {
                    locationId: GHL_LOCATION_ID,
                    name: agreement.title,
                    client: {
                        name: agreement.clientName,
                        email: agreement.clientEmail,
                        phone: agreement.clientPhone
                    },
                    proposal: {
                        scope: agreement.scope,
                        terms: agreement.terms,
                        pricing: agreement.pricing
                    }
                }
            });

            // Track GHL's response data back into your specific schema variables
            if (ghlResponse.data?.proposal?.id || ghlResponse.data?.id) {
                agreement.ghlDocumentId = ghlResponse.data?.proposal?.id || ghlResponse.data?.id;
            }
        } catch (ghlError) {
            // FIXED: Captures exact external sync failures directly inside backend.log cleanly
            req.log.error({
                ghlDetails: ghlError.response?.data || ghlError.message
            }, 'GHL Synchronization Failed (Cached locally)');
        }

        // 4. Save updates back to MongoDB securely
        await agreement.save();

        // Standardized wrapper output to satisfy frontend expectations seamlessly
        return res.status(200).json({
            success: true,
            _id: agreement._id,
            agreementId: agreement._id,
            agreement
        });

    } catch (error) {
        // FIXED: Log fatal processing failures to file via Pino
        req.log.error(error, 'Agreement Processing Fatal Exception');
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};

export const getAgreementDetails = async (req, res) => {
    try {
        const { agreement_id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(agreement_id)) {
            return res.status(400).json({ error: 'Invalid identifier format requested.' });
        }

        const agreement = await AgreementModel.findById(agreement_id);

        if (!agreement) {
            return res.status(404).json({ error: 'Agreement lookup returned no records.' });
        }

        return res.status(200).json({ agreement });
    } catch (error) {
        // FIXED: Log unexpected lookup bugs directly to backend.log
        req.log.error(error, 'Agreement Fetch Fatal Exception');
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};
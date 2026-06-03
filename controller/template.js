import TemplateModel from "../model/template.js"
import axios from "axios"
import mongoose from "mongoose"

export const getAllTemplate = async (req, res) => {

    try {

        const GHL_API_KEY = process.env.GHL_API_KEY;
        const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;
        const GHL_BASE_URL = process.env.GHL_BASE_URL || 'https://services.leadconnectorhq.com/v1';

        let templates = [];

        // 1. Try to fetch existing templates from GoHighLevel V2/Proposals API
        try {
            const ghlResponse = await axios.get(`${GHL_BASE_URL}/proposals/templates`, {
                params: { locationId: GHL_LOCATION_ID },
                headers: {
                    'Authorization': `Bearer ${GHL_API_KEY}`,
                    'Version': '2023-02-21',
                    'Content-Type': 'application/json'
                }
            });

            if (ghlResponse.data?.templates?.length > 0) {
                // Normalize GHL templates to match the properties your frontend looks for
                templates = ghlResponse.data.templates.map(gt => ({
                    _id: gt.id, // Map GHL string ID to _id for create.js frontend matching
                    name: gt.name,
                    description: gt.description || 'GoHighLevel Cloud Template',
                    defaultPricing: {
                        monthlyFee: gt.template?.pricing?.monthlyFee || 0,
                        setupFee: gt.template?.pricing?.setupFee || 0,
                        currency: gt.template?.pricing?.currency || 'USD'
                    },
                    isGHL: true
                }));
            }
        } catch (ghlError) {
            console.error('GHL templates unavailable or missing, falling back to MongoDB:', ghlError.message);
        }

        // 2. Fallback to MongoDB if GHL returned no records
        if (templates.length === 0) {
            const mongoTemplates = await TemplateModel.find({ isActive: true });
            templates = mongoTemplates.map(mt => ({
                _id: mt._id.toString(),
                name: mt.name,
                description: mt.description,
                defaultPricing: mt.defaultPricing,
                isGHL: false
            }));
        }

        return res.status(200).json({ templates });
    } catch (error) {
        console.error('Template Listing API Error:', error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }

}

export const getSingleTemplate = async (req, res) => {
    try {
        // Extract ID dynamically to support both parameter formats safely
        const id = req.params.template_id || req.params.id;

        if (!id) {
            return res.status(400).json({ error: 'Template ID parameter is required.' });
        }

        // 1. Check if ID is a valid MongoDB ObjectId. If so, check local DB first
        if (mongoose.Types.ObjectId.isValid(id)) {
            const mongoTemplate = await TemplateModel.findById(id);
            if (mongoTemplate) {
                return res.status(200).json({ template: mongoTemplate });
            }
        }

        // 2. If not a Mongo ID or not found locally, locate inside GoHighLevel
        const GHL_API_KEY = process.env.GHL_API_KEY;
        const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;
        const GHL_BASE_URL = process.env.GHL_BASE_URL || 'https://services.leadconnectorhq.com/v1';

        try {
            const ghlResponse = await axios.get(`${GHL_BASE_URL}/proposals/templates`, {
                params: { locationId: GHL_LOCATION_ID },
                headers: {
                    'Authorization': `Bearer ${GHL_API_KEY}`,
                    'Version': '2023-02-21',
                    'Content-Type': 'application/json'
                }
            });

            // FIXED: Using the properly matched 'id' variable here
            const ghlTemplate = ghlResponse.data?.templates?.find(t => t.id === id);

            if (ghlTemplate) {
                // Build standard template layout structure matching your UI keys
                const normalizedTemplate = {
                    _id: ghlTemplate.id,
                    name: ghlTemplate.name,
                    defaultScope: ghlTemplate.template?.scope || 'Predefined scope context...',
                    defaultPricing: {
                        monthlyFee: ghlTemplate.template?.pricing?.monthlyFee || 0,
                        setupFee: ghlTemplate.template?.pricing?.setupFee || 0,
                        currency: ghlTemplate.template?.pricing?.currency || 'USD'
                    },
                    defaultTerms: ghlTemplate.template?.terms || 'Standard terms contract configuration.',
                    templateHtml: ghlTemplate.template?.html || ''
                };
                return res.status(200).json({ template: normalizedTemplate });
            }
        } catch (ghlError) {
            console.error('Error fetching dynamic template configuration from GHL:', ghlError.message);
        }

        return res.status(404).json({ error: 'Template details could not be retrieved.' });
    } catch (error) {
        console.error('Template Detail Lookup Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
import axios from "axios";
import * as pd_api from "pandadoc-node-client";

/**
 * Helper to initialize the PandaDoc Templates API Instance dynamically
 */
const getPandaTemplatesClient = () => {
    const PANDADOC_API_KEY = process.env.PANDA_API_KEY;

    const configuration = pd_api.createConfiguration({
        authMethods: {
            apiKey: `API-Key ${PANDADOC_API_KEY}`
        }
    });

    return new pd_api.TemplatesApi(configuration);
};

/**
 * Fetch existing templates from PandaDoc Workspace
 * Route: GET /pandadoc/template-listing
 */
export const listPandaTemplates = async (req, res) => {
    try {
        if (!process.env.PANDA_API_KEY) {
            req.log.warn('PandaDoc API Key is missing from environment configurations.');
            return res.status(400).json({ error: 'PandaDoc integration is not configured on the server.' });
        }

        const PANDADOC_API_KEY = process.env.PANDA_API_KEY;
        const configuration = pd_api.createConfiguration(
            { authMethods: { apiKey: `API-Key ${PANDADOC_API_KEY}` } }
        );
        const apiInstance = new pd_api.TemplatesApi(configuration);

        // Fetch templates from the PandaDoc workspace
        const apiResponse = await apiInstance.listTemplates({ deleted: false });

        return res.status(200).json({
            success: true,
            results: apiResponse.results || apiResponse || []
        });

    } catch (error) {
        // Structural error logging integration via Pino (matching your agreement/template files)
        req.log.error(error, 'PandaDoc Template Listing API Fatal Error');
        return res.status(500).json({
            error: 'Internal Server Error',
            details: error.response?.data || error.message
        });
    }
};

/**
 * Create a new template setup inside your PandaDoc Workspace using Direct API (Axios)
 * Route: POST /pandadoc/create-template
 */
export const createPandaTemplate = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Template name configuration is required.' });
        }

        if (!process.env.PANDA_API_KEY) {
            return res.status(400).json({ error: 'PandaDoc integration is not configured on the server.' });
        }

        // FIXED: Since version 6.2.0 of the SDK does not support template creation natively,
        // we execute a direct, robust HTTP request to PandaDoc's public V1 templates endpoint.
        const apiResponse = await axios.post(
            "https://api.pandadoc.com/public/v1/templates",
            {
                name: name,
                metadata: {
                    description: description || "Generated via Express CRM Asset Manager"
                }
            },
            {
                headers: {
                    "Authorization": `API-Key ${process.env.PANDA_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        return res.status(200).json({
            success: true,
            message: 'Template successfully created in PandaDoc workspace.',
            template: apiResponse.data
        });

    } catch (error) {
        // Captures exact external client processing failures inside backend logs cleanly via Pino
        req.log.error({
            pandaDetails: error.response?.data || error.message
        }, 'PandaDoc Template Provisioning Fatal Exception');

        return res.status(500).json({
            error: 'Internal Server Error',
            details: error.response?.data || error.message
        });
    }
};
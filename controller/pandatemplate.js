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
        const apiResponse = await apiInstance.listTemplates({ deleted: false });

        return res.status(200).json({
            success: true,
            results: apiResponse.results || apiResponse || []
        });

    } catch (error) {
        req.log.error(error, 'PandaDoc Template Listing API Fatal Error');
        return res.status(500).json({
            error: 'Internal Server Error',
            details: error.response?.data || error.message
        });
    }
};

/**
 * Create a new template and immediately generate a secure short-lived Embedded Editor session token (E-Token)
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

        // STEP 1: Provision the template framework blueprint inside your PandaDoc Workspace
        const templateApiResponse = await axios.post(
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

        // Extract the newly created template ID out of the response payload context
        const templateId = templateApiResponse.data.id;

        // STEP 2: Immediately request an active short-lived editing session token for this new template
        const sessionApiResponse = await axios.post(
            `https://api.pandadoc.com/public/v1/templates/${templateId}/editing-sessions`,
            {
                email: "admin@clickmatix.com", // The master editor context identity
                lifetime: 3600                // Token remains valid for 1 hour
            },
            {
                headers: {
                    "Authorization": `API-Key ${process.env.PANDA_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        // STEP 3: Return the unified payload structure back to your frontend layout components
        return res.status(200).json({
            success: true,
            message: 'Template successfully created in workspace, and design session token generated.',
            template: templateApiResponse.data,
            token: sessionApiResponse.data.token,
            expires_at: sessionApiResponse.data.expires_at
        });

    } catch (error) {
        req.log.error({
            pandaDetails: error.response?.data || error.message
        }, 'PandaDoc Template Provisioning & Automated Session Token Pipeline Failure');

        return res.status(500).json({
            error: 'Internal Server Error',
            details: error.response?.data || error.message
        });
    }
};

/**
 * Create a secure short-lived Embedded Editor session token (E-Token)
 * Route: POST /pandadoc/templates/:template_id/editing-session
 */
export const getTemplateEditingSession = async (req, res) => {
    try {
        const { template_id } = req.body; // Map template target ID cleanly

        if (!template_id) {
            return res.status(400).json({ error: 'Template identifier query property is required.' });
        }

        if (!process.env.PANDA_API_KEY) {
            return res.status(400).json({ error: 'PandaDoc integration is not configured on the server.' });
        }

        // Issue token via PandaDoc's official Template Editing Sessions route
        const apiResponse = await axios.post(
            `https://api.pandadoc.com/public/v1/templates/${template_id}/editing-sessions`,
            {
                email: "admin@clickmatix.com", // The master editor context identity
                lifetime: 3600 // Token remains valid for 1 hour
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
            token: apiResponse.data.token,
            expires_at: apiResponse.data.expires_at
        });

    } catch (error) {
        req.log.error({
            pandaDetails: error.response?.data || error.message
        }, 'PandaDoc Embedded Editor Session Fatal Exception');

        return res.status(500).json({
            error: 'Internal Server Error',
            details: error.response?.data || error.message
        });
    }
};
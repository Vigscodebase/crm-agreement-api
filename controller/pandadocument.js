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
 * Fetch live matching documents context inventory
 * Route: GET /pandadoc/document-listing
 */
export const listPandaDocuments = async (req, res) => {
    try {
        if (!process.env.PANDA_API_KEY) {
            req.log.warn('PandaDoc API Key is missing from environment configurations.');
            return res.status(400).json({ error: 'PandaDoc integration is not configured on the server.' });
        }

        const apiResponse = await axios.get(
            "https://api.pandadoc.com/public/v1/documents",
            {
                headers: {
                    "Authorization": `API-Key ${process.env.PANDA_API_KEY}`
                }
            }
        );

        return res.status(200).json({
            success: true,
            results: apiResponse.data.results || apiResponse.data || []
        });

    } catch (error) {
        req.log.error(error, 'PandaDoc Document Listing API Fatal Error');
        return res.status(500).json({
            error: 'Internal Server Error',
            details: error.response?.data || error.message
        });
    }
};

/**
 * Instantiate an active document signature block framework from a base template layout model 
 * Route: POST /pandadoc/create-document
 */
export const createPandaDocument = async (req, res) => {
    try {
        const { template_id, name } = req.body;

        if (!template_id) {
            return res.status(400).json({ error: 'Source template identifier mapping parameter is required.' });
        }

        if (!process.env.PANDA_API_KEY) {
            return res.status(400).json({ error: 'PandaDoc integration is not configured on the server.' });
        }

        const apiResponse = await axios.post(
            "https://api.pandadoc.com/public/v1/documents",
            {
                name: name || "Conversion Rate Optimization Proposal Template - Test 1",
                template_uuid: template_id,
                recipients: [
                    {
                        email: "placeholder-client@clickmatix.com",
                        first_name: "Client",
                        last_name: "Signer",
                        role: "Client"
                    }
                ]
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
            message: 'Document framework successfully initialized from template model blueprint.',
            document: apiResponse.data
        });

    } catch (error) {
        req.log.error({
            pandaDetails: error.response?.data || error.message
        }, 'PandaDoc Document Provisioning Fatal Exception');

        return res.status(500).json({
            error: 'Internal Server Error',
            details: error.response?.data || error.message
        });
    }
};

/**
 * Generate secure session tokens targeting document instance layouts
 * Route: POST /pandadoc/create-document-edit
 */
export const getDocumentEditingSession = async (req, res) => {
    try {
        const { document_id } = req.body;

        if (!document_id) {
            return res.status(400).json({ error: 'Document unique object identification key parameter is required.' });
        }

        if (!process.env.PANDA_API_KEY) {
            return res.status(400).json({ error: 'PandaDoc integration is not configured on the server.' });
        }

        const apiResponse = await axios.post(
            `https://api.pandadoc.com/public/v1/documents/${document_id}/editing-sessions`,
            {
                email: "admin@clickmatix.com",
                lifetime: 3600
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
        }, 'PandaDoc Document Interactive Studio Session Exception');

        return res.status(500).json({
            error: 'Internal Server Error',
            details: error.response?.data || error.message
        });
    }
};

/**
 * Transition draft models and execute delivery dispatch channels to end clients
 * Route: POST /pandadoc/send-document
 */
export const sendPandaDocument = async (req, res) => {
    try {
        const { document_id } = req.body;

        if (!document_id) {
            return res.status(400).json({ error: 'Target destination document identifier parameter is required.' });
        }

        if (!process.env.PANDA_API_KEY) {
            return res.status(400).json({ error: 'PandaDoc integration is not configured on the server.' });
        }

        const apiResponse = await axios.post(
            `https://api.pandadoc.com/public/v1/documents/${document_id}/send`,
            {
                message: "Please review and process execution configurations within your document signature block framework panel.",
                subject: "Action Required: Your Proposed System Agreement Layout Is Ready for Review",
                silent: false
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
            message: 'Agreement envelope dispatched successfully out to recipient workflows.',
            status: apiResponse.data.status
        });

    } catch (error) {
        req.log.error({
            pandaDetails: error.response?.data || error.message
        }, 'PandaDoc Document Execution Dispatch Pipeline Exception');

        return res.status(500).json({
            error: 'Internal Server Error',
            details: error.response?.data || error.message
        });
    }
};

/**
 * NEW: Fetch and proxy down the un-redacted generated compilation PDF document directly as a binary stream blob
 * Route: GET /pandadoc/download-document/:documentId
 */
export const downloadPandaDocumentPdf = async (req, res) => {
    try {
        const { documentId } = req.params;

        if (!documentId) {
            return res.status(400).json({ error: 'Path bound dynamic parameter asset documentId value required.' });
        }

        if (!process.env.PANDA_API_KEY) {
            return res.status(400).json({ error: 'PandaDoc integration is not configured on the server.' });
        }

        // Fetch stream directly from upstream PandaDoc server
        const apiResponse = await axios.get(
            `https://api.pandadoc.com/public/v1/documents/${documentId}/download`,
            {
                headers: {
                    "Authorization": `API-Key ${process.env.PANDA_API_KEY}`
                },
                responseType: "stream"
            }
        );

        // Attach content-type headers so client-side browsers recognize the file stream
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="PandaDoc_${documentId}.pdf"`);

        // Pipe upstream data directly to local response pipelines
        return apiResponse.data.pipe(res);

    } catch (error) {
        req.log.error({
            pandaDetails: error.response?.data || error.message
        }, 'PandaDoc PDF Stream Generation Processing Exception');

        return res.status(500).json({
            error: 'Internal Server Error',
            details: error.response?.data || error.message
        });
    }
};

/**
 * Purge individual document units completely out of your workspace context mapping indices
 * Route: DELETE /pandadoc/delete-document/:documentId
 */
export const deletePandaDocument = async (req, res) => {
    try {
        const { documentId } = req.params;

        if (!documentId) {
            return res.status(400).json({ error: 'Path bound dynamic parameter asset documentId value parameter required.' });
        }

        if (!process.env.PANDA_API_KEY) {
            return res.status(400).json({ error: 'PandaDoc integration is not configured on the server.' });
        }

        await axios.delete(
            `https://api.pandadoc.com/public/v1/documents/${documentId}`,
            {
                headers: {
                    "Authorization": `API-Key ${process.env.PANDA_API_KEY}`
                }
            }
        );

        return res.status(200).json({
            success: true,
            message: 'Document purged and deleted successfully from tracking metrics data registries.'
        });

    } catch (error) {
        req.log.error({
            pandaDetails: error.response?.data || error.message
        }, 'PandaDoc Document Dropping System Pipeline Exception');

        return res.status(500).json({
            error: 'Internal Server Error',
            details: error.response?.data || error.message
        });
    }
};
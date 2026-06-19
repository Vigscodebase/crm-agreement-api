import axios from "axios";

/**
 * Helper to dynamically generate secure authorization headers for SignNow REST client instances
 */
const getSignNowHeaders = () => {
    const SIGNNOW_TOKEN = process.env.SIGNNOW_API_KEY || process.env.SIGNNOW_ACCESS_TOKEN;
    return {
        "Authorization": `Bearer ${SIGNNOW_TOKEN}`,
        "Content-Type": "application/json"
    };
};

/**
 * Fetch live matching documents context inventory from the system folder
 * Route: GET /signnow/document-listing
 */
export const listSignNowDocuments = async (req, res) => {
    try {
        if (!process.env.SIGNNOW_API_KEY && !process.env.SIGNNOW_ACCESS_TOKEN) {
            req.log.warn('SignNow authentication credentials are missing from environment layouts.');
            return res.status(400).json({ error: 'SignNow integration is not configured on the server.' });
        }

        const headers = getSignNowHeaders();

        // 1. Fetch the user's root folder setup to find the actual "Documents" folder ID
        const folderStructureResponse = await axios.get("https://api.signnow.com/user/folder", { headers });
        const rootFolder = folderStructureResponse.data;
        let targetFolderId = rootFolder?.id;

        // 2. Identify the core "Documents" system folder from the subfolders list
        const foldersList = rootFolder?.folders || [];
        const documentsFolder = foldersList.find(f => f.name?.toLowerCase() === 'documents' || f.system_folder === true);

        if (documentsFolder) {
            targetFolderId = documentsFolder.id;
        }

        if (!targetFolderId) {
            return res.status(404).json({ error: 'Could not resolve a target SignNow Documents folder destination.' });
        }

        // 3. Query the identified folder directly to pull the document collection list
        const apiResponse = await axios.get(`https://api.signnow.com/folder/${targetFolderId}`, { headers });
        const rawDocuments = apiResponse.data.documents || [];

        // Map live properties directly into your screenshot's exact filter metrics categories
        const mappedDocuments = rawDocuments.map(doc => {
            let cleanStatus = 'draft';

            if (doc.unbinned_states?.is_completed || doc.filled) {
                cleanStatus = 'signed';
            } else if (doc.unbinned_states?.is_invited) {
                cleanStatus = 'waiting for others';
            } else if (doc.unbinned_states?.is_viewed) {
                cleanStatus = 'waiting for me';
            } else if (doc.unbinned_states?.is_declined) {
                cleanStatus = 'declined';
            } else if (doc.unbinned_states?.is_expired) {
                cleanStatus = 'expired';
            } else if (doc.unbinned_states?.is_pending) {
                cleanStatus = 'pending';
            }

            return {
                id: doc.id,
                name: doc.document_name || "New Proposed Service Agreement Layout",
                status: cleanStatus,
                date_modified: doc.updated ? parseInt(doc.updated) * 1000 : doc.created ? parseInt(doc.created) * 1000 : Date.now(),
                amount: doc.amount || '0.00',
                currency: { symbol: doc.currency_symbol || '₹' }
            };
        });

        return res.status(200).json({
            success: true,
            results: mappedDocuments
        });

    } catch (error) {
        req.log.error(error, 'SignNow Document Listing API Fatal Error');
        return res.status(500).json({
            error: 'Internal Server Error',
            details: error.response?.data || error.message
        });
    }
};

/**
 * Instantiate an active document signature block framework from a base template layout model
 * Route: POST /signnow/create-document
 */
export const createSignNowDocument = async (req, res) => {
    try {
        const { template_id, name } = req.body;

        if (!template_id) {
            return res.status(400).json({ error: 'Source template identifier mapping parameter is required.' });
        }

        if (!process.env.SIGNNOW_API_KEY && !process.env.SIGNNOW_ACCESS_TOKEN) {
            return res.status(400).json({ error: 'SignNow integration is not configured on the server.' });
        }

        const apiResponse = await axios.post(
            `https://api.signnow.com/template/${template_id}/copy`,
            { document_name: name || "Conversion Rate Optimization Proposal Template - Test 1" },
            { headers: getSignNowHeaders() }
        );

        return res.status(200).json({
            success: true,
            message: 'Document framework successfully initialized from template model blueprint.',
            document: apiResponse.data
        });

    } catch (error) {
        req.log.error({
            signnowDetails: error.response?.data || error.message
        }, 'SignNow Document Provisioning Fatal Exception');

        return res.status(500).json({
            error: 'Internal Server Error',
            details: error.response?.data || error.message
        });
    }
};

/**
 * Generate secure session links targeting document instance studio layouts
 * Route: POST /signnow/templates/create-document-edit
 */
export const getDocumentEditingSession = async (req, res) => {
    try {
        const { document_id } = req.body;

        if (!document_id) {
            return res.status(400).json({ error: 'Document unique object identification key parameter is required.' });
        }

        if (!process.env.SIGNNOW_API_KEY && !process.env.SIGNNOW_ACCESS_TOKEN) {
            return res.status(400).json({ error: 'SignNow integration is not configured on the server.' });
        }

        const apiResponse = await axios.post(
            `https://api.signnow.com/v2/documents/${document_id}/embedded-sending`,
            {
                type: "document",
                link_expiration: 45,
                redirect_uri: "https://signnow.com",
                attributes: {
                    default_fields: { visibility: true },
                    fields: {
                        signature: { visibility: true },
                        text: { visibility: true },
                        fullname: { visibility: true },
                        email: { visibility: true },
                        checkbox: { visibility: true },
                        radiobutton: { visibility: true },
                        attachment: { visibility: true },
                        dropdown: { visibility: true },
                        stamp: { visibility: true },
                        formula: { visibility: true }
                    }
                }
            },
            { headers: getSignNowHeaders() }
        );

        const sessionUrl = apiResponse.data.data?.url || apiResponse.data.token || "";

        return res.status(200).json({
            success: true,
            token: sessionUrl,
            expires_at: Math.floor(Date.now() / 1000) + 3600
        });

    } catch (error) {
        req.log.error({
            signnowDetails: error.response?.data || error.message
        }, 'SignNow Document Interactive Studio Session Exception');

        return res.status(500).json({
            error: 'Internal Server Error',
            details: error.response?.data || error.message
        });
    }
};

/**
 * Transition draft models and execute delivery invite dispatch channels to end clients
 * Route: POST /signnow/send-document
 */
export const sendSignNowDocument = async (req, res) => {
    try {
        const { document_id } = req.body;

        if (!document_id) {
            return res.status(400).json({ error: 'Target destination document identifier parameter is required.' });
        }

        if (!process.env.SIGNNOW_API_KEY && !process.env.SIGNNOW_ACCESS_TOKEN) {
            return res.status(400).json({ error: 'SignNow integration is not configured on the server.' });
        }

        await axios.post(
            `https://api.signnow.com/document/${document_id}/invite`,
            {
                to: [{
                    email: "placeholder-client@clickmatix.com",
                    role: "Client",
                    order: 1,
                    subject: "Action Required: Your Proposed System Agreement Layout Is Ready for Review",
                    message: "Please review and process execution configurations within your document signature block framework panel."
                }]
            },
            { headers: getSignNowHeaders() }
        );

        return res.status(200).json({
            success: true,
            message: 'Agreement envelope dispatched successfully out to recipient workflows.',
            status: 'waiting for others'
        });

    } catch (error) {
        req.log.error({
            signnowDetails: error.response?.data || error.message
        }, 'SignNow Document Execution Dispatch Pipeline Exception');

        return res.status(500).json({
            error: 'Internal Server Error',
            details: error.response?.data || error.message
        });
    }
};

/**
 * Synchronize and return status configurations directly back to client workflow sessions
 * Route: POST /signnow/update-status
 */
export const updateSignNowDocumentStatus = async (req, res) => {
    try {
        const { document_id, status } = req.body;

        if (!document_id || !status) {
            return res.status(400).json({ error: 'Both document_id and target status configurations are required.' });
        }

        return res.status(200).json({
            success: true,
            message: 'Document tracking matrix state manually adjusted and synchronized locally.',
            details: { document_id, status: status.toLowerCase() }
        });

    } catch (error) {
        req.log.error(error, 'SignNow Manual Status Override Context Failure Exception');
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * Fetch and proxy down the un-redacted generated compilation PDF document directly as a binary stream blob
 * Route: GET /signnow/download-document/:documentId
 */
export const downloadSignNowDocumentPdf = async (req, res) => {
    try {
        const { documentId } = req.params;

        if (!documentId) {
            return res.status(400).json({ error: 'Path bound dynamic parameter asset documentId value required.' });
        }

        if (!process.env.SIGNNOW_API_KEY && !process.env.SIGNNOW_ACCESS_TOKEN) {
            return res.status(400).json({ error: 'SignNow integration is not configured on the server.' });
        }

        const apiResponse = await axios.get(
            `https://api.signnow.com/document/${documentId}/download`,
            {
                headers: getSignNowHeaders(),
                responseType: "stream"
            }
        );

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="AgreementAsset_${documentId}.pdf"`);

        return apiResponse.data.pipe(res);

    } catch (error) {
        req.log.error({
            signnowDetails: error.response?.data || error.message
        }, 'SignNow PDF Stream Generation Processing Exception');

        return res.status(500).json({
            error: 'Internal Server Error',
            details: error.response?.data || error.message
        });
    }
};

/**
 * Purge individual document units completely out of your workspace context mapping indices
 * Route: DELETE /signnow/delete-document/:documentId
 */
export const deleteSignNowDocument = async (req, res) => {
    try {
        const { documentId } = req.params;

        if (!documentId) {
            return res.status(400).json({ error: 'Path bound dynamic parameter asset documentId value parameter required.' });
        }

        if (!process.env.SIGNNOW_API_KEY && !process.env.SIGNNOW_ACCESS_TOKEN) {
            return res.status(400).json({ error: 'SignNow integration is not configured on the server.' });
        }

        await axios.delete(`https://api.signnow.com/document/${documentId}`, {
            headers: getSignNowHeaders()
        });

        return res.status(200).json({
            success: true,
            message: 'Document purged and deleted successfully from tracking metrics data registries.'
        });

    } catch (error) {
        req.log.error({
            signnowDetails: error.response?.data || error.message
        }, 'SignNow Document Dropping System Pipeline Exception');

        return res.status(500).json({
            error: 'Internal Server Error',
            details: error.response?.data || error.message
        });
    }
};
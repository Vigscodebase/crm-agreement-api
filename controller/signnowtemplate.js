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
 * Fetch existing templates from SignNow Workspace
 * Route: GET /signnow/template-listing
 */
export const listSignNowTemplates = async (req, res) => {
    try {
        if (!process.env.SIGNNOW_API_KEY && !process.env.SIGNNOW_ACCESS_TOKEN) {
            req.log.warn('SignNow access authentication keys are missing from environment configurations.');
            return res.status(400).json({ error: 'SignNow integration is not configured on the server.' });
        }

        const folderResponse = await axios.get("https://api.signnow.com/user/folder", {
            headers: getSignNowHeaders()
        });

        const rootFolders = folderResponse.data.folders || folderResponse.data || [];
        const templatesFolder = Array.isArray(rootFolders)
            ? rootFolders.find(f => f.name?.toLowerCase() === 'templates')
            : null;

        let rawTemplates = [];

        if (templatesFolder && templatesFolder.id) {
            const folderDetails = await axios.get(`https://api.signnow.com/folder/${templatesFolder.id}`, {
                headers: getSignNowHeaders()
            });
            rawTemplates = folderDetails.data.documents || folderDetails.data.templates || [];
        } else {
            const docResponse = await axios.get("https://api.signnow.com/user/documents", {
                headers: getSignNowHeaders()
            });
            const allDocs = docResponse.data.documents || docResponse.data || [];
            rawTemplates = allDocs.filter(d => d.template === true || d.is_template === true);
        }

        const templates = rawTemplates.map(tmpl => ({
            id: tmpl.id || tmpl.unique_id,
            name: tmpl.document_name || tmpl.template_name || tmpl.name || "Untitled Agreement Template",
            description: tmpl.description || "Generated via Express CRM Asset Manager"
        }));

        return res.status(200).json({
            success: true,
            results: templates
        });

    } catch (error) {
        req.log.error(error, 'SignNow Template Listing API Fatal Error');
        return res.status(500).json({
            error: 'Internal Server Error',
            details: error.response?.data || error.message
        });
    }
};

/**
 * Create a new template and immediately generate a secure short-lived Embedded Editor session token/link
 * Route: POST /signnow/create-template
 */
export const createSignNowTemplate = async (req, res) => {
    try {
        const { name, description } = req.body;

        const autoName = `Template Asset — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        const finalTemplateName = name && name.trim() ? name.trim() : autoName;

        const SIGNNOW_TOKEN = process.env.SIGNNOW_API_KEY || process.env.SIGNNOW_ACCESS_TOKEN;
        if (!SIGNNOW_TOKEN) {
            return res.status(400).json({ error: 'SignNow integration is not configured on the server.' });
        }

        // STEP 1: Generate a valid 1-page structural placeholder PDF document stream chunk
        const blankPdfBase64 = "JVBERi0xLjQKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqMiAwIG9iajw8L1R5cGUvUGFnZXMvS2lkc1szIDAgUl0vQ291bnQgMT4+ZW5kb2JqMyAwIG9iajw8L1R5cGUvUGFnZS9QYXJlbnQgMiAwIFIvTWVkaWFCb3xbMCAwIDU5NSA4NDJdL0NvbnRlbnRzIDQgMCBSPj5lbmRvYmo0IDAgb2JqPDwvTGVuZ3RoIDY+PnN0cmVhbQolJUVPRgplbmRzdHJlYW1lbmRvYmoKc2VyaWFsIDEyMzQ1Njc4OQp0cmFpbGVyPDwvU2l6ZSA1L1Jvb3QgMSAwIFI+PgpzdGFydHhyZWYKMTUwCgolJUVPRg==";
        const pdfBuffer = Buffer.from(blankPdfBase64, 'base64');

        const uploadForm = new FormData();
        const fileBlob = new Blob([pdfBuffer], { type: 'application/pdf' });
        uploadForm.append('file', fileBlob, `${finalTemplateName}.pdf`);

        const uploadResponse = await axios.post("https://api.signnow.com/document", uploadForm, {
            headers: { "Authorization": `Bearer ${SIGNNOW_TOKEN}` }
        });

        const documentId = uploadResponse.data.id || uploadResponse.data.unique_id;
        if (!documentId) {
            throw new Error("Failed to initialize baseline base layout asset boundary from SignNow storage.");
        }

        // STEP 2: Flatten document asset into a template
        // FIX: Replaced template_name with document_name to match SignNow API contracts
        const templateApiResponse = await axios.post(
            "https://api.signnow.com/template",
            {
                document_id: documentId,
                document_name: finalTemplateName
            },
            { headers: getSignNowHeaders() }
        );

        const templateId = templateApiResponse.data.id || templateApiResponse.data.unique_id;

        // STEP 3: PIPELINE CLEANUP
        try {
            await axios.delete(`https://api.signnow.com/document/${documentId}`, {
                headers: getSignNowHeaders()
            });
        } catch (cleanupError) {
            req.log.warn({ cleanupError }, "SignNow non-blocking cleanup warning: Temporary source document could not be dropped.");
        }

        // STEP 4: PASS FIELD CONFIGURATIONS VIA EMBEDDED EDITOR
        // FIX: Using /embedded-editor instead of embedded-sending to ensure structural name changes bind permanently
        const sessionApiResponse = await axios.post(
            `https://api.signnow.com/v2/documents/${templateId}/embedded-editor`,
            {
                link_expiration: 45,
                redirect_uri: "https://signnow.com",
                redirect_target: "self"
            },
            { headers: getSignNowHeaders() }
        );

        // const sessionApiResponse = await axios.post(
        //     `https://api.signnow.com/v2/documents/${templateId}/embedded-editor`,
        //     {
        //         type: "document",
        //         link_expiration: 45,
        //         redirect_uri: "https://signnow.com",
        //         // Explicit configurations telling the left sidebar to unlock the Personal Data smart widgets
        //         attributes: {
        //             default_fields: {
        //                 visibility: true
        //             },
        //             fields: {
        //                 signature: { visibility: true },
        //                 text: { visibility: true },
        //                 fullname: { visibility: true },
        //                 email: { visibility: true },
        //                 checkbox: { visibility: true },
        //                 radiobutton: { visibility: true },
        //                 attachment: { visibility: true },
        //                 dropdown: { visibility: true },
        //                 stamp: { visibility: true },
        //                 formula: { visibility: true }
        //             }
        //         }
        //     },
        //     { headers: getSignNowHeaders() }
        // );

        return res.status(200).json({
            success: true,
            message: 'Template successfully created in workspace, and design session token generated.',
            template: { id: templateId, name: finalTemplateName, description: description || "Generated via Express CRM Asset Manager" },
            token: sessionApiResponse.data.data?.url || sessionApiResponse.data.token || "",
            expires_at: Math.floor(Date.now() / 1000) + (45 * 60)
        });

    } catch (error) {
        req.log.error({
            signnowDetails: error.response?.data || error.message
        }, 'SignNow Template Provisioning & Automated Session Token Pipeline Failure');

        return res.status(500).json({
            error: 'Internal Server Error',
            details: error.response?.data || error.message
        });
    }
};

/**
 * Create a secure short-lived Embedded Editor session token link for an existing layout asset
 * Route: POST /signnow/templates/editing-session
 */
export const getTemplateEditingSession = async (req, res) => {
    try {
        const { template_id } = req.body;

        if (!template_id) {
            return res.status(400).json({ error: 'Template identifier query property is required.' });
        }

        if (!process.env.SIGNNOW_API_KEY && !process.env.SIGNNOW_ACCESS_TOKEN) {
            return res.status(400).json({ error: 'SignNow integration is not configured on the server.' });
        }

        // FIX: Aligned edit route to use embedded-editor endpoint contract rules
        const apiResponse = await axios.post(
            `https://api.signnow.com/v2/documents/${template_id}/embedded-editor`,
            {
                link_expiration: 45,
                redirect_uri: "https://signnow.com",
                redirect_target: "self"
            },
            { headers: getSignNowHeaders() }
        );

        return res.status(200).json({
            success: true,
            token: apiResponse.data.data?.url || apiResponse.data.token,
            expires_at: Math.floor(Date.now() / 1000) + (45 * 60)
        });

    } catch (error) {
        req.log.error({
            signnowDetails: error.response?.data || error.message
        }, 'SignNow Embedded Editor Session Fatal Exception');

        return res.status(500).json({
            error: 'Internal Server Error',
            details: error.response?.data || error.message
        });
    }
};

/**
 * Delete a template permanently from SignNow Workspace
 * Route: DELETE /signnow/delete-template/:template_id
 */
export const deleteSignNowTemplate = async (req, res) => {
    try {
        const { template_id } = req.params;

        if (!template_id) {
            return res.status(400).json({ error: 'Template parameter identifier is required.' });
        }

        if (!process.env.SIGNNOW_API_KEY && !process.env.SIGNNOW_ACCESS_TOKEN) {
            return res.status(400).json({ error: 'SignNow integration is not configured on the server.' });
        }

        await axios.delete(`https://api.signnow.com/document/${template_id}`, {
            headers: getSignNowHeaders()
        });

        return res.status(200).json({
            success: true,
            message: 'Template successfully purged from workspace.'
        });

    } catch (error) {
        req.log.error({
            signnowDetails: error.response?.data || error.message
        }, 'SignNow Template Deletion Exception Hierarchy');

        return res.status(500).json({
            error: 'Internal Server Error',
            details: error.response?.data || error.message
        });
    }
};
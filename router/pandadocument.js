import express from "express";
import {
    listPandaDocuments,
    createPandaDocument,
    getDocumentEditingSession,
    sendPandaDocument,
    updatePandaDocumentStatus,
    deletePandaDocument,
    downloadPandaDocumentPdf
} from "../controller/pandadocument.js"

const pandadocumentrout = express.Router();

var urlencodedParser = express.urlencoded({ limit: '5mb', extended: true });
var jsonParser = express.json({ limit: '5mb' });

pandadocumentrout.get('/document-listing', listPandaDocuments)
pandadocumentrout.post('/create-document', jsonParser, createPandaDocument)
pandadocumentrout.post('/create-document-edit', jsonParser, getDocumentEditingSession)
pandadocumentrout.post('/send-document', jsonParser, sendPandaDocument)
pandadocumentrout.patch('/update-status', jsonParser, updatePandaDocumentStatus)
pandadocumentrout.delete('/delete-document/:documentId', jsonParser, deletePandaDocument)
pandadocumentrout.get('/download-document/:documentId', downloadPandaDocumentPdf)

export default pandadocumentrout;
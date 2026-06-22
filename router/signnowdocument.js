import express from "express";
import {
    listSignNowDocuments,
    createSignNowDocument,
    getDocumentEditingSession,
    sendSignNowDocument,
    updateSignNowDocumentStatus,
    downloadSignNowDocumentPdf,
    deleteSignNowDocument,
    saveSignNowDocumentRecipient
} from "../controller/signnowdocument.js"

const signnowdocumentrout = express.Router();

var urlencodedParser = express.urlencoded({ limit: '5mb', extended: true });
var jsonParser = express.json({ limit: '5mb' });

signnowdocumentrout.get("/document-listing", listSignNowDocuments)
signnowdocumentrout.post("/create-document", jsonParser, createSignNowDocument)
signnowdocumentrout.post("/templates/create-document-edit", jsonParser, getDocumentEditingSession)
signnowdocumentrout.post("/send-document", jsonParser, sendSignNowDocument)
signnowdocumentrout.post("/update-status", jsonParser, updateSignNowDocumentStatus)
signnowdocumentrout.post("/save-recipient", jsonParser, saveSignNowDocumentRecipient)
signnowdocumentrout.get("/download-document/:documentId", downloadSignNowDocumentPdf)
signnowdocumentrout.delete("/delete-document/:documentId", deleteSignNowDocument)

export default signnowdocumentrout;
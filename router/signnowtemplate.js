import express from "express";
import {
    listSignNowTemplates,
    createSignNowTemplate,
    getTemplateEditingSession,
    deleteSignNowTemplate,
} from "../controller/signnowtemplate.js"

const signnowtemplaterout = express.Router();

var urlencodedParser = express.urlencoded({ limit: '5mb', extended: true });
var jsonParser = express.json({ limit: '5mb' });

signnowtemplaterout.get("/template-listing", listSignNowTemplates)
signnowtemplaterout.post("/create-template", jsonParser, createSignNowTemplate)
signnowtemplaterout.post("/templates/editing-session", jsonParser, getTemplateEditingSession)
signnowtemplaterout.delete("/delete-template/:template_id", deleteSignNowTemplate)

export default signnowtemplaterout;
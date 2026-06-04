import express from "express";
import { createPandaTemplate, listPandaTemplates } from "../controller/pandatemplate.js"

const pandatemplaterout = express.Router();

var urlencodedParser = express.urlencoded({ limit: '5mb', extended: true });
var jsonParser = express.json({ limit: '5mb' });

pandatemplaterout.get('/template-listing', listPandaTemplates)
pandatemplaterout.post('/create-template', jsonParser, createPandaTemplate)

export default pandatemplaterout;
import express from "express";
import { getAllTemplate, getSingleTemplate } from "../controller/template.js"

const templaterout = express.Router();

var urlencodedParser = express.urlencoded({ limit: '5mb', extended: true });
var jsonParser = express.json({ limit: '5mb' });

templaterout.get("/template-listing", getAllTemplate);
templaterout.get("/get-single-template/:template_id", getSingleTemplate);

export default templaterout;
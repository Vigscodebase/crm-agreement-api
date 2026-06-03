import express from "express";
import { updateAgreementDetails, getAgreementDetails } from "../controller/agreement.js"

const agreementrout = express.Router();

var urlencodedParser = express.urlencoded({ limit: '5mb', extended: true });
var jsonParser = express.json({ limit: '5mb' });

agreementrout.put('/update/:agreement_id', jsonParser, updateAgreementDetails);
agreementrout.get('/fetch-fallback/:agreement_id', getAgreementDetails);

export default agreementrout;
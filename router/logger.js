import express from "express";
import { getFrontendLog } from "../controller/logger.js"

const loggerrout = express.Router();

var urlencodedParser = express.urlencoded({ limit: '5mb', extended: true });
var jsonParser = express.json({ limit: '5mb' });

loggerrout.post('/client-errors', jsonParser, getFrontendLog);

export default loggerrout;
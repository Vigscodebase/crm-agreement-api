import express from "express";
import { fetchrole } from "../controller/role.js"

const rolerout = express.Router();

rolerout.get("/all-roles", fetchrole)

export default rolerout;
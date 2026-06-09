import express from "express";
import { login, signup, allUser, getSingleUser, updateUsr, editUsr } from "../controller/user.js"

const userrout = express.Router();

var urlencodedParser = express.urlencoded({ limit: '5mb', extended: true });
var jsonParser = express.json({ limit: '5mb' });

userrout.post("/login", jsonParser, login)
userrout.post("/add-user-account", jsonParser, signup)
userrout.get("/single-user/:usr_ID", getSingleUser)
userrout.get("/user-listing", allUser);
userrout.patch("/update-single-user/:usr_ID", jsonParser, updateUsr);
userrout.patch("/edit-single-user/:usr_ID", jsonParser, editUsr);

export default userrout;
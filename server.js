import express from "express";
import dotenv from 'dotenv';
import http from "http"
import path from 'path';
import { WebSocketServer } from 'ws';
import cors from "cors"
import mongoose from "mongoose";
import { fileURLToPath } from 'url';
import templaterout from "./router/template.js"
import agreementrout from "./router/agreement.js"

dotenv.config({ debug: true });
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, '/public')))
export const wss = new WebSocketServer({ server });

app.get('/', (req, res) => {
    res.send(`Express CRM Agreement Server running successfully`);
});

server.listen(PORT, () => {
    console.log(`The server is running at ${PORT} port.`);
});


mongoose.connect(process.env.MONGODB_URI).then(() => {
    console.log("Clickmatix Agreement CRM database connected");
})

const whitelist = ['http://192.168.2.63:5174']

const corsOptions = {
    origin: function (origin, callback) {
        if (whitelist.indexOf(origin) !== -1 || !origin) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
}

app.use(cors(corsOptions))

app.use("/template", templaterout);
app.use("/agreement", agreementrout);
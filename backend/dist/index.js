"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWT_SECRET = void 0;
const express_1 = __importDefault(require("express"));
const client_1 = __importDefault(require("./routers/client"));
const helper_1 = __importDefault(require("./routers/helper"));
// import express from "express";
// import userRouter from "./routers/user"
// import workerRouter from "./routers/worker"
// import cors from "cors";
// const app = express();
exports.JWT_SECRET = "karthik1234";
const app = (0, express_1.default)();
app.use(express_1.default.json());
// app.use(cors())
app.use("/v1/user", client_1.default);
app.use("/v1/worker", helper_1.default);
app.listen(3000);

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const _1 = require(".");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// const jwt = Jwt()
// eimport jwt from "jsonwebtoken";
function authMiddleware(req, res, next) {
    var _a;
    const authHeader = (_a = req.headers["authorization"]) !== null && _a !== void 0 ? _a : "";
    // const decoded = jwt.verify(authHeader, JWT_SECRET);
    // console.log("authorization is ",authHeader);
    try {
        const decoded = jsonwebtoken_1.default.verify(authHeader, _1.JWT_SECRET);
        console.log(decoded);
        // @ts-ignore
        if (decoded.id) {
            // @ts-ignore
            req.userId = decoded.id;
            return next();
        }
        else {
            return res.status(403).json({
                message: "You are not logged in"
            });
        }
    }
    catch (e) {
        return res.status(403).json({
            e
        });
    }
}
exports.authMiddleware = authMiddleware;

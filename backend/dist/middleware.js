"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.helperMiddleware = exports.authMiddleware = void 0;
const jwtsecretkey_1 = require("./jwtsecretkey");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// const jwt = Jwt()
// eimport jwt from "jsonwebtoken";
function authMiddleware(req, res, next) {
    var _a;
    const authHeader = (_a = req.headers["authorization"]) !== null && _a !== void 0 ? _a : "";
    // const decoded = jwt.verify(authHeader, JWT_SECRET);
    // console.log("authorization is ",authHeader);
    try {
        const decoded = jsonwebtoken_1.default.verify(authHeader, jwtsecretkey_1.JWT_SECRET);
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
const helperMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // @ts-ignore
    const header = (_a = req.headers['authorization']) !== null && _a !== void 0 ? _a : "";
    try {
        const check = jsonwebtoken_1.default.verify(header, jwtsecretkey_1.Helper_JWT_Secret);
        if (check) {
            //@ts-ignore
            req.helper_id = check.id;
            return next();
        }
        else {
            res.status(401).json({
                message: "You are not logged in"
            });
        }
    }
    catch (e) {
        res.json(e);
    }
});
exports.helperMiddleware = helperMiddleware;

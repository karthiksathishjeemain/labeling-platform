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
const express_1 = require("express");
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwtsecretkey_1 = require("../jwtsecretkey");
const middleware_1 = require("../middleware");
const prismaClient = new client_1.PrismaClient();
const router = (0, express_1.Router)();
router.post('/signin', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const hardcodededaddress = 'fbuerbfuerf';
    const check_existing_user = yield prismaClient.worker.findFirst({
        // address : String( hardcodededaddress)
        where: {
            address: hardcodededaddress
        }
    });
    if (check_existing_user) {
        const token = jsonwebtoken_1.default.sign({
            id: check_existing_user
        }, jwtsecretkey_1.Helper_JWT_Secret);
        res.json(token);
    }
    else {
        const helper = yield prismaClient.worker.create({
            data: {
                address: hardcodededaddress,
                pending_amount: 0,
                locked_amount: 0
            }
        });
        const token = jsonwebtoken_1.default.sign({
            id: helper.id
        }, jwtsecretkey_1.Helper_JWT_Secret);
        res.json({
            token
        });
    }
}));
router.get('/nexttask', middleware_1.helperMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const helper_id = req.helper_id;
    const response = yield prismaClient.task.findMany({
        where: {
            done: false
        },
        include: {
            options: true
        }
    });
    res.json(response);
}));
exports.default = router;

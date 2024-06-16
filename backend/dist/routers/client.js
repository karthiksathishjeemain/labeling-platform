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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_1 = require("../index");
const middleware_1 = require("../middleware");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_presigned_post_1 = require("@aws-sdk/s3-presigned-post");
const router = (0, express_1.Router)();
const prismaClient = new client_1.PrismaClient();
const AWS = require('aws-sdk');
// const s3 = new AWS.S3()
// AWS.config.update({ accessKeyId: 'AKIA47CR3CNHETSOWMMW', secretAccessKey: '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' })
// Tried with and without this. Since s3 is not region-specific, I don't
// think it should be necessary.
// AWS.config.update({region: 'us-west-2'})
const s3Client = new client_s3_1.S3Client({
    credentials: {
        accessKeyId: (_a = process.env.ACCESS_KEY_ID) !== null && _a !== void 0 ? _a : "",
        secretAccessKey: (_b = process.env.ACCESS_SECRET) !== null && _b !== void 0 ? _b : "",
    },
    region: "eu-north-1"
});
router.get("/presignedUrl", middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // @ts-ignore
    const userId = req.userId;
    const { url, fields } = yield (0, s3_presigned_post_1.createPresignedPost)(s3Client, {
        Bucket: 'decentrelized-fiver',
        Key: `check1/${userId}/${Math.random()}/image.jpg`,
        Conditions: [
            ['content-length-range', 0, 5 * 1024 * 1024] // 5 MB max
        ],
        Expires: 3600
    });
    res.json({
        url,
        fields
    });
}));
router.post('/signin', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const hardaddress = '6D42eUQgfp2h4Jr369bYoZJZK5gYfz8roJaHmN3LnA3c';
    const existing_user = yield prismaClient.user.findFirst({
        where: {
            address: hardaddress
        }
    });
    if (existing_user) {
        const token = jsonwebtoken_1.default.sign({
            id: existing_user.id,
            // address:existing_user.address
        }, index_1.JWT_SECRET);
        res.json({ token });
    }
    else {
        const user = yield prismaClient.user.create({
            data: {
                address: hardaddress
            }
        });
        const token = jsonwebtoken_1.default.sign({
            id: user.id
        }, index_1.JWT_SECRET);
        res.json({ token });
    }
    // res.json(existing_user)
}));
exports.default = router;

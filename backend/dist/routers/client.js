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
const jwtsecretkey_1 = require("../jwtsecretkey");
const middleware_1 = require("../middleware");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_presigned_post_1 = require("@aws-sdk/s3-presigned-post");
const types_1 = require("../types");
const router = (0, express_1.Router)();
const prismaClient = new client_1.PrismaClient();
// const AWS = require('aws-sdk');
// const s3 = new AWS.S3()
const DEFAULT_TITLE = "Select the most clickable thumbnail";
// AWS.config.update({region: 'us-west-2'})
router.post("/task", middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // @ts-ignore 
    const userId = req.userId;
    const body = req.body;
    const parseData = types_1.createTaskInput.safeParse(body);
    if (!parseData.success) {
        return res.status(411).json({
            message: "You've sent the wrong inputs"
        });
    }
    let response = yield prismaClient.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        var _c;
        const response = yield tx.task.create({
            data: {
                title: (_c = parseData.data.title) !== null && _c !== void 0 ? _c : DEFAULT_TITLE,
                amount: 1,
                //TODO: Signature should be unique in the table else people can reuse a signature
                signature: parseData.data.signature,
                user_id: userId
            }
        });
        yield tx.option.createMany({
            data: parseData.data.options.map(x => ({
                image_url: x.imageUrl,
                task_id: response.id
            }))
        });
        return response;
    }));
    res.json({
        id: response.id
    });
}));
router.get("/tasksubmitted", middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // @ts-ignore
    const userId = req.userId;
    const task_id = req.query.task_id;
    //    const parseData = createSubmissionInput.safeParse(body);
    //    if (!parseData.success){
    //     res.json({
    //         message : "Wrong input fields"
    //     })
    //    }
    const taskDetails = yield prismaClient.task.findFirst({
        where: {
            id: Number(task_id),
            user_id: Number(userId)
        },
        include: {
            options: true
        }
    });
    const result = {};
    const responses = yield prismaClient.submission.findMany({
        where: {
            task_id: Number(task_id)
        },
        include: {
            option: true
        }
    });
    taskDetails === null || taskDetails === void 0 ? void 0 : taskDetails.options.forEach(option => result[option.id] = {
        count: 0,
        option: {
            imageUrl: option.image_url
        }
    });
    // res.json(result)
    responses.forEach(r => {
        result[r.option_id].count++;
    });
    res.json({
        result,
        taskDetails,
    });
    //    res.json submission
}));
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
        Fields: {
            'Content-type': 'image/png'
        },
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
        }, jwtsecretkey_1.JWT_SECRET);
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
        }, jwtsecretkey_1.JWT_SECRET);
        res.json({ token });
    }
    // res.json(existing_user)
}));
exports.default = router;

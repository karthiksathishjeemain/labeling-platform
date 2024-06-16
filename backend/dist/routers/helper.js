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
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const express_1 = require("express");
const router = (0, express_1.Router)();
const prismaClient = new client_1.PrismaClient();
const JWT_SECRET = "karthik123";
router.post('/signin', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // const hardaddress = '6D42eUQgfp2h4Jr369bYoZJZK5gYfz8roJaHmN3LnA3c'
    // const existing_user = await prismaClient.user.findFirst({
    //     where: {
    //         address: hardaddress
    //     }
    // })
    // if (existing_user) {
    //     const token = jwt.sign({
    //         id: existing_user.id
    //     }, JWT_SECRET)
    //     res.json({ token })
    // }
    // else {
    //     const newuser = await prismaClient.worker.create({
    //         data:{
    //             address:hardaddress,
    //             pending_amount: 0,
    //             locked_amount: 0
    //         }
    //     })
    // }
}));
exports.default = router;

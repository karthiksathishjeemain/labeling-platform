import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
const router = Router();
const prismaClient = new PrismaClient();
const JWT_SECRET = "karthik123";
router.post('/signin', async (req, res) => {
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
})
export default router;
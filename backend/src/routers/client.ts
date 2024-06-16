import { Prisma, PrismaClient } from '@prisma/client';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../index';
import { authMiddleware } from '../middleware';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createPresignedPost } from '@aws-sdk/s3-presigned-post'

const router = Router();
const prismaClient = new PrismaClient();
// const AWS = require('aws-sdk');


// const s3 = new AWS.S3()


// 
// AWS.config.update({region: 'us-west-2'})

const s3Client = new S3Client({
    credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.ACCESS_SECRET ?? "",
    },
    region: "eu-north-1"
})
router.get("/presignedUrl", authMiddleware, async (req, res) => {
    // @ts-ignore
    const userId = req.userId;

    const { url, fields } = await createPresignedPost(s3Client, {
        Bucket: 'decentrelized-fiver',
        Key: `check1/${userId}/${Math.random()}/image.jpg`,
        Conditions: [
          ['content-length-range', 0, 5 * 1024 * 1024] // 5 MB max
        ],
        Expires: 3600
    })

    res.json({
       url,
        fields
    })
    
})
router.post('/signin', async (req, res) => {
    const hardaddress = '6D42eUQgfp2h4Jr369bYoZJZK5gYfz8roJaHmN3LnA3c'
    const existing_user = await prismaClient.user.findFirst({
        where: {
            address: hardaddress
        }
    })
    if (existing_user) {
        const token = jwt.sign({
            id: existing_user.id,
            // address:existing_user.address
        }, JWT_SECRET)
        res.json({ token })
    }
    else {
        const user = await prismaClient.user.create({
            data: {
                address: hardaddress
            }
        })
        const token = jwt.sign({
            id: user.id
        }, JWT_SECRET)
        res.json({ token })
    }
    // res.json(existing_user)
})
export default router;
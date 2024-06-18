import { Prisma, PrismaClient } from '@prisma/client';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../jwtsecretkey';
import { authMiddleware } from '../middleware';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createPresignedPost } from '@aws-sdk/s3-presigned-post'
import { createTaskInput,createSubmissionInput } from '../types';
import { SCIENTIFIC_NUMBER } from '../jwtsecretkey';
const router = Router();
const prismaClient = new PrismaClient();
// const AWS = require('aws-sdk');


// const s3 = new AWS.S3()


const DEFAULT_TITLE = "Select the most clickable thumbnail";
// AWS.config.update({region: 'us-west-2'})
router.post("/task", authMiddleware, async (req, res) => {
    // @ts-ignore 
    const userId = req.userId;
    const body = req.body;
    const parseData = createTaskInput.safeParse(body);

    if (!parseData.success) {
        return res.status(411).json({
            message: "You've sent the wrong inputs"
        })
    }
    let response = await prismaClient.$transaction(async tx => {

        const response = await tx.task.create({
            data: {
                title: parseData.data.title ?? DEFAULT_TITLE,
                amount: 1*SCIENTIFIC_NUMBER,
                //TODO: Signature should be unique in the table else people can reuse a signature
                signature: parseData.data.signature,
                user_id: userId
            }
        });

        await tx.option.createMany({
            data: parseData.data.options.map(x => ({
                image_url: x.imageUrl,
                task_id: response.id
            }))
        })

        return response;

    })

    res.json({
        id: response.id
    })

})
router.get("/tasksubmitted", authMiddleware, async (req, res) => {
    // @ts-ignore
    const userId = req.userId;
    const task_id = req.query.task_id;
    
//    const parseData = createSubmissionInput.safeParse(body);
//    if (!parseData.success){
//     res.json({
//         message : "Wrong input fields"
//     })
//    }
   const taskDetails = await prismaClient.task.findFirst({
    where:{
       id: Number(task_id),
       user_id:Number(userId)

        
    },
    include :{
        options:true
    }
   })
   const result : Record<string, {
    count: number;
    option: {
        imageUrl: string
    }
}>  = {};
const responses = await prismaClient.submission.findMany({
    where: {
        task_id: Number(task_id)
    },
    include: {
        option: true
    }
});
   taskDetails?.options.forEach(option=>
    result[option.id]={
       count : 0,
       option :{
        imageUrl : option.image_url
       }
    }
   )
// res.json(result)
responses.forEach(r => {
    result[r.option_id].count++;
});

res.json({
    result,
    taskDetails,
    
})
//    res.json submission
   
})

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
        Fields: {
            'Content-type': 'image/png'
        },
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
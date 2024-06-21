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
import { PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";
import { Connection, Transaction } from "@solana/web3.js";
import web3 from "@solana/web3.js"
// import { decodeUTF8 } from "tweetnacl-util";
let total_options=0;

// const s3 = new AWS.S3()

const RPC_URL="https://solana-devnet.g.alchemy.com/v2/3GJ4zQKCBd2vn1uo9LDAkxPzgmIpYSUE"
const connection = new Connection(RPC_URL);
// let connection = new web3.Connection(web3.clusterApiUrl("devnet"), "confirmed");
const PARENT_WALLET_ADDRESS = "5JWCUecggSz4F7o5pUES5nEfBG8UGRzwWUtwsxvnB1dP";
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
    console.log("Transaction sign is",parseData.data.signature)
    const transaction = await connection.getTransaction(parseData.data.signature, {
        maxSupportedTransactionVersion: 1
    });

    console.log(transaction);

    if ((transaction?.meta?.postBalances[1] ?? 0) - (transaction?.meta?.preBalances[1] ?? 0) !== 100000000) {
        return res.status(411).json({
            message: "Transaction signature/amount incorrect"
        })
    }

    if (transaction?.transaction.message.getAccountKeys().get(1)?.toString() !== PARENT_WALLET_ADDRESS) {
        return res.status(411).json({
            message: "Transaction sent to wrong address"
        })
    }
     
    const user = await prismaClient.user.findFirst({
        where: {
            id: userId
        }
    })
    if (transaction?.transaction.message.getAccountKeys().get(0)?.toString() !== user?.address) {
        return res.status(411).json({
            message: "Transaction sent from wrong address"
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
   if (!taskDetails) {
    return res.status(411).json({
        message: "You dont have access to this task"
    })
}
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
console.log("here")
   taskDetails.options.forEach(option=>
    result[option.id]={
       count : 0,
       option :{
        imageUrl : option.image_url
       }
    },
    total_options++
   )
//    console.log(result[])
console.log(task_id)
console.log("here2")
console.log(responses)
// res.json(result)
responses.forEach(r => {
    result[r.option_id].count++;
});
console.log("here3")

res.json({
    result,
    taskDetails,
    total_options
    
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
    console.log("entered presignedUrl")
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
    // const hardaddress = '6D42eUQgfp2h4Jr369bYoZJZK5gYfz8roJaHmN3LnA3c'
    
    const { publicKey, signature } = req.body;
    const message = new TextEncoder().encode("Sign into mechanical turks");

    const result = nacl.sign.detached.verify(
        message,
        new Uint8Array(signature.data),
        new PublicKey(publicKey).toBytes(),
    );


    if (!result) {
        return res.status(411).json({
            message: "Incorrect signature"
        })
    }

  try{  const existing_user = await prismaClient.user.findFirst({
        where: {
            address: publicKey
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
                address: publicKey
            }
        })
        const token = jwt.sign({
            id: user.id
        }, JWT_SECRET)
        res.json({ token })
    }}
    catch(e){
        res.json(e)
    }
    // res.json(existing_user)
})
export default router;
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { Helper_JWT_Secret } from "../jwtsecretkey";
import { helperMiddleware } from "../middleware";
import { createSubmissionInput } from "../types";
import { SCIENTIFIC_NUMBER } from "../jwtsecretkey";
import nacl from "tweetnacl";
// import { PublicKey } from "@solana/web3.js";
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { privateKey } from "../privateKey";
import { decode } from "bs58";
// const connection = new Connection(process.env.RPC_URL ?? "");
const RPC_URL="https://solana-devnet.g.alchemy.com/v2/3GJ4zQKCBd2vn1uo9LDAkxPzgmIpYSUE"
const connection = new Connection(RPC_URL);
const prismaClient = new PrismaClient();
const router = Router();
const TOTAL_SUBMISSIONS=100
router.post('/signin',async(req,res)=>{
    // const hardcodededaddress = 'fbuerbfuerf3';
    const {signature, publicKey} = req.body;
    const message = new TextEncoder().encode("Sign into mechanical turks as a worker");
    console.log("signature is",signature);
    console.log("Publickey  is",publicKey);

    const result = nacl.sign.detached.verify(
        message,
        new Uint8Array(signature.data),
        new PublicKey(publicKey).toBytes(),
    );
   console.log("result is",result)
    if (!result) {
        return res.status(411).json({
            message: "Incorrect signature"
        })
    }
    const check_existing_user = await prismaClient.worker.findFirst({
        // address : String( hardcodededaddress)
        where:{
            address:publicKey
        }
    })
    if (check_existing_user){
        const token = jwt.sign({
            id:check_existing_user.id
        },Helper_JWT_Secret)
        console.log("token is",token)
        console.log("Pending amount is :", check_existing_user.pending_amount / SCIENTIFIC_NUMBER)
        res.json({token,amount: check_existing_user.pending_amount / SCIENTIFIC_NUMBER})

    }
    else {
        const helper = await prismaClient.worker.create({
            data:{
               address : publicKey,
               pending_amount:0,
               locked_amount :0
            }
        })
        const token = jwt.sign({
            id : helper.id
        },Helper_JWT_Secret)
        res.json({
           token
        })

    }
   
})
router.get('/nexttask',helperMiddleware,async(req,res)=>{
    //@ts-ignore
     const helper_id = req.helper_id;
    
     const response = await prismaClient.task.findFirst({
        where:{
            done:false,
            submissions:{
                    none:{
                        worker_id:helper_id
                    }
            }
        },
        select:{
            id:true,
            amount : true,
            title : true,
            options : true,
           
           
        }
     })
     console.log("reached the endpoint")
     console.log(response)
     res.json({response})

     
    
     
})
router.post('/submission',helperMiddleware,async(req,res)=>{
    // @ts-ignore
   try{ const helper_id=req.helper_id
    const body = req.body;
    
    const parsedata= createSubmissionInput.safeParse(body);
    if (!parsedata.success){
      return res.json({
        message : "The body is not in the required form"
      })
    }
    
    const task = await prismaClient.task.findFirst({
        where:{
            done:false,
            submissions:{
                    none:{
                        worker_id:helper_id
                    }
            }
        },
        select:{
            id:true,
            options : true,
            title : true,
            amount : true
        }
     })
     if (!task || task?.id !== Number(parsedata.data.taskId)) {
        console.log("Worker is ",helper_id)
        console.log("Front end submitted task id",parsedata.data.taskId)
        console.log("Authenticated task id",task?.id)
        return res.status(411).json({
            message: "Incorrect task id"
        })}
     
    const amount = (task.amount/ TOTAL_SUBMISSIONS);
    await prismaClient.$transaction(async tx =>{
    await prismaClient.submission.create({
        data:{
            worker_id:helper_id,
            option_id:Number(parsedata.data.selection),
            task_id:Number(parsedata.data.taskId),
            amount :amount
        }
    })
    await tx.worker.update({
        where:{
            id:helper_id
        },
        data:{
            pending_amount:{
                increment:amount
            }
        }

    })

})
    
    const nexttask = await prismaClient.task.findFirst({
        where:{
            done:false,
            submissions:{
                    none:{
                        worker_id:helper_id
                    }
            }
        },
        select:{
            id:true,
            options : true,
            title : true,
            amount : true
        }
     })
     
    res.status(200).json({
       nexttask,
       amount
       
    });
}
catch(e){
    res.json({
        message:e
    })
}
})
router.get('/balance',helperMiddleware,async(req,res)=>{
    //@ts-ignore
   const helper_id= req.helper_id;
   const worker= await prismaClient.worker.findFirst({
        where:{
            id:helper_id
        }
       
    })
    res.json({
        pending_amount : worker?.pending_amount,
        locked_amount: worker?.locked_amount
    })
})
router.post("/payout", helperMiddleware, async (req, res) => {
    // @ts-ignore
    const userId: number = req.helper_id;
    const worker = await prismaClient.worker.findFirst({
        where: { id: userId }
    })

    if (!worker) {
        return res.status(403).json({
            message: "User not found"
        })
    }

    const transaction = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: new PublicKey("5JWCUecggSz4F7o5pUES5nEfBG8UGRzwWUtwsxvnB1dP"),
            toPubkey: new PublicKey(worker.address),
            lamports: 1000_000_000 * worker.pending_amount / SCIENTIFIC_NUMBER,
        })
    );


    console.log(worker.address);

    const keypair = Keypair.fromSecretKey(decode(privateKey));

    // TODO: There's a double spending problem here
    // The user can request the withdrawal multiple times
    // Can u figure out a way to fix it?
    let signature = "";
    try {
        signature = await sendAndConfirmTransaction(
            connection,
            transaction,
            [keypair],
        );
    
     } catch(e) {
        return res.json({
            message: "Transaction failed"
        })
     }
    
    console.log(signature)

    // We should add a lock here
    await prismaClient.$transaction(async tx => {
        await tx.worker.update({
            where: {
                id: Number(userId)
            },
            data: {
                pending_amount: {
                    decrement: worker.pending_amount
                },
                locked_amount: {
                    increment: worker.pending_amount
                }
            }
        })

        await tx.payouts.create({
            data: {
                user_id: Number(userId),
                amount: worker.pending_amount,
                status: "Processing",
                signature: signature
            }
        })

    })
    console.log("Amount is paid to ",worker.address)
    res.json({
        message: "Processing payout",
        amount: worker.pending_amount
    })


})

export default router
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { Helper_JWT_Secret } from "../jwtsecretkey";
import { helperMiddleware } from "../middleware";
import { createSubmissionInput } from "../types";
// import { SCIENTIFIC_NUMBER } from "../jwtsecretkey";
import nacl from "tweetnacl";
import { PublicKey } from "@solana/web3.js";
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
        res.json(token)

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
    const helper_id=req.helper_id
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
export default router
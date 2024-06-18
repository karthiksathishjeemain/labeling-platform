import { NextFunction } from "express";
import {Response,Request}from "express";
import { JWT_SECRET, Helper_JWT_Secret } from "./jwtsecretkey";
import jwt from 'jsonwebtoken';
// const jwt = Jwt()
// eimport jwt from "jsonwebtoken";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers["authorization"] ??"";
    // const decoded = jwt.verify(authHeader, JWT_SECRET);
    // console.log("authorization is ",authHeader);

    try {
        const decoded = jwt.verify(authHeader, JWT_SECRET);
        console.log(decoded);
        // @ts-ignore
        if (decoded.id) {
            // @ts-ignore
            req.userId = decoded.id;
            return next();
        } else {
            return res.status(403).json({
                message: "You are not logged in"
            })    
        }
    } catch(e) {
        return res.status(403).json({
            e
        })
    }
}
export const  helperMiddleware = async (req:Request,res:Response,next: NextFunction)=>{
    // @ts-ignore
const header = req.headers['authorization']??"";

try{const check = jwt.verify(header,Helper_JWT_Secret)
if (check){
    //@ts-ignore
    req.helper_id =check.id
    return next()
}
else {
    res.status(401).json({
        message:"You are not logged in"
    })
}
}
catch(e){
    res.json(e)
}}

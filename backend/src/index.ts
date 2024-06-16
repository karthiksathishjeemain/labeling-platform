import express from'express';
import clientRouter from './routers/client';
import helperRouter from './routers/helper';
// import express from "express";
// import userRouter from "./routers/user"
// import workerRouter from "./routers/worker"
// import cors from "cors";

// const app = express();
export const JWT_SECRET="karthik1234";

const app= express();
app.use(express.json());
// app.use(cors())

app.use("/v1/user", clientRouter);
app.use("/v1/worker", helperRouter);

app.listen(3000)
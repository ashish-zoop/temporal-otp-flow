import { Router } from "express";
import { verifyOtpRouter } from "./verifyOtp/otp.routes";

//base-router for service
export const apiRouter: Router = Router();

apiRouter.use("/otp", verifyOtpRouter); //already protected by auth service

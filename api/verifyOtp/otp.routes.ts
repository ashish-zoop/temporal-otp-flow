import { Router } from "express";
import { OtpController } from "./otp.controller";

const controller = new OtpController();
const verifyOtpRouter: Router = Router();

verifyOtpRouter.post("/generate", controller.generateOtp);
verifyOtpRouter.post("/verify", controller.verifyOtp);
verifyOtpRouter.post("/resendOtp", controller.resendOtp);

export { verifyOtpRouter };

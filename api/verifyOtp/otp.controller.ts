import { Request, Response } from "express";
import {
    getOnboardingData,
    onboardingVerification,
} from "../../workflows/onboarding";
import { TemporalClient } from "../../connections/temporalConnection";
import { TASK_QUEUE_NAME } from "../../constants";
import { uuid as uuidv4 } from "uuidv4";
import { OnboardingData, VERIFICATION_STATE } from "../../types";

export class OtpController {
    public verifyOtp = async (req: Request, res: Response): Promise<any> => {
        const temporalClient = TemporalClient.getInstance();

        const otp = req.body.otp;
        const customer_id = req.body.customer_id;

        const onboardingData = (await temporalClient.queryWorkflow(
            customer_id,
            getOnboardingData
        )) as OnboardingData;

        if (onboardingData.verificationState !== VERIFICATION_STATE.SENT) {
            return res.status(400).json({
                message: `Onboarding has either not started or has been closed`,
            });
        }

        console.info("Sending OTP for verification", {
            otp,
        });

        await temporalClient.signalWorkflow(
            customer_id,
            "verifyOtpCommand",
            otp
        );

        return res.status(200).json({
            message: `Verification Started`,
            customer_id: customer_id,
        });
    };

    public generateOtp = async (req: Request, res: Response): Promise<any> => {
        const phone_number = req.body.phone_number;
        const customer_id = uuidv4();

        console.info("Starting Onboarding workflow", {
            phone_number,
        });

        const temporalClient = TemporalClient.getInstance();
        await temporalClient.startWorkflow(
            onboardingVerification,
            [
                {
                    phone_number: phone_number,
                    customer_id: customer_id,
                },
            ],
            TASK_QUEUE_NAME,
            customer_id
        );
        console.info("Started Onboarding workflow");

        return res.status(200).json({
            message: `OTP Sent Succesfully`,
            customer_id: customer_id,
        });
    };

    public resendOtp = async (req: Request, res: Response): Promise<any> => {
        const temporalClient = TemporalClient.getInstance();

        const customer_id = req.body.customer_id;

        const onboardingData = (await temporalClient.queryWorkflow(
            customer_id,
            getOnboardingData
        )) as OnboardingData;

        console.info("Resending OTP for verification", {
            otp: onboardingData.OTP,
        });

        if (onboardingData.verificationState !== VERIFICATION_STATE.SENT) {
            return res.status(400).json({
                message: `Onboarding has either not started or has been closed`,
            });
        }

        await temporalClient.signalWorkflow(customer_id, "resendOtpCommand");

        return res.status(200).json({
            message: `Verification Started`,
            customer_id: customer_id,
        });
    };
}

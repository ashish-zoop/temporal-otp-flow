import { proxyActivities } from "@temporalio/workflow";
import type * as activities from "../activities/activities";
import * as wf from "@temporalio/workflow";
import {
    VERIFICATION_STATE,
    OnboardingData,
    NOTIFY,
    onboardingInput,
} from "../types";

const { sendOTP, notifyCustomer, generateOTP } = proxyActivities<
    typeof activities
>({
    startToCloseTimeout: "60s",
    retry: {
        initialInterval: "10s",
        backoffCoefficient: 2,
        maximumAttempts: 5,
        maximumInterval: "10s",
    },
});

export const verifyOtpCommand = wf.defineSignal<[string]>("verifyOtpCommand");
export const resendOtpCommand = wf.defineSignal<[string]>("resendOtpCommand");
export const getOnboardingData =
    wf.defineQuery<Record<string, any>>("getOnboardingData");

export async function onboardingVerification(
    verificationInput: onboardingInput
) {
    const onboardingData = createVerificationState(verificationInput);

    setWfHandlers(onboardingData);

    //1
    onboardingData.OTP = await generateOTP();
    onboardingData.verificationState = VERIFICATION_STATE.GENERATED;

    //2
    await sendOTP(onboardingData.OTP, onboardingData.phone_number);
    onboardingData.verificationState = VERIFICATION_STATE.SENT;

    //3

    const result: boolean = await wf.condition(
        () => onboardingData.verificationState !== VERIFICATION_STATE.SENT,
        "120s"
    );
    if (!result) {
        onboardingData.verificationState = VERIFICATION_STATE.EXPIRED;
        await notifyCustomer(onboardingData.phone_number, NOTIFY.EXPIRED);
    }

    //4
    await notifyCustomer(onboardingData.phone_number, "COMPLETED");
    return onboardingData;
}

export function createVerificationState(verificationInput: onboardingInput) {
    const verificationData: OnboardingData = {
        OTP: null,
        verificationState: VERIFICATION_STATE.REQUESTED,
        customerVerified: false,
        resendCount: 0,
        phone_number: verificationInput.phone_number,
        customer_id: verificationInput.customer_id, //TODO: shift to activity, can be non-deterministic
        verificationAttempts: 0,
    };

    return verificationData;
}

export function setWfHandlers(onboardingData: OnboardingData) {
    wf.setHandler(verifyOtpCommand, async (incomingOTP: string) => {
        onboardingData.verificationAttempts++;

        if (onboardingData.OTP === incomingOTP) {
            await notifyCustomer(onboardingData.phone_number, NOTIFY.VERIFIED);
            onboardingData.verificationState = VERIFICATION_STATE.VERIFIED;
            onboardingData.customerVerified = true;
            return;
        }

        await notifyCustomer(onboardingData.phone_number, NOTIFY.INCORRECT);

        if (onboardingData.verificationAttempts === 3) {
            await notifyCustomer(onboardingData.phone_number, NOTIFY.ATTEMPTS);
            onboardingData.verificationState =
                VERIFICATION_STATE.ATTEMPTS_EXCEEDED;
        }

        return;
    });

    wf.setHandler(resendOtpCommand, async () => {
        onboardingData.resendCount++;

        if (onboardingData.resendCount < 4) {
            await sendOTP(onboardingData.OTP, onboardingData.phone_number);
            return;
        }

        await notifyCustomer(onboardingData.phone_number, NOTIFY.RESEND);
        onboardingData.verificationState = VERIFICATION_STATE.RESEND_EXCEEDED;
        return;
    });

    wf.setHandler(getOnboardingData, () => onboardingData);
}

export enum VERIFICATION_STATE {
    REQUESTED = "OTP_REQUESTED",
    GENERATED = "OTP_GENERATED",
    SENT = "OTP_SENT",
    VERIFIED = "OTP_VERIFIED",
    //
    // INCORRECT = "OTP_INCORRECT",
    //
    ATTEMPTS_EXCEEDED = "ATTEMPTS_EXCEEDED",
    RESEND_EXCEEDED = "RESEND_EXCEEDED",
    //
    EXPIRED = "EXPIRED",
}

export interface onboardingInput {
    phone_number: string;
    customer_input: string;
}

export interface OnboardingData {
    OTP: string;
    verificationState: VERIFICATION_STATE;

    customerVerified: boolean;

    phone_number: string;
    customer_id: string; //TODO: shift to activity, can be non-deterministic

    verificationAttempts: number;
    resendCount: number;
}

export interface onboardingInput {
    phone_number: string;
    customer_id: string;
}

export enum NOTIFY {
    VERIFIED = "VERIFIED",
    //
    INCORRECT = "INCORRECT",
    //
    ATTEMPTS = "ATTEMPTS_EXCEEDED",
    RESEND = "RESEND_EXCEEDED",
    //
    EXPIRED = "EXPIRED",
}

export interface TwilioWhatsappSendResponse {
    account_sid: string;
    api_version: string;
    body: string;
    date_created: string;
    date_sent: null;
    date_updated: string;
    direction: "outbound-api";
    error_code: null;
    error_message: null;
    from: string;
    messaging_service_sid: null;
    num_media: "0";
    num_segments: "1";
    price: null;
    price_unit: null;
    sid: string;
    status: "queued";
    subresource_uris: {
        media: string;
    };
    to: "whatsapp:+918700229084";
    uri: string;
}

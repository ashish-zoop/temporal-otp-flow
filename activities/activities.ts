// Add Activity Definitions here.
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import qs from "qs";
import { customerNotifications } from "../constants";
import { TwilioWhatsappSendResponse } from "../types";

export async function greet(name: string) {
    await sleep(25000);

    console.log(`Hello, ${name}`);

    return `Hello, ${name}`;
}

function sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

export async function sendOTP(otp: string, phone_number: string) {
    const data = qs.stringify({
        To: `whatsapp:+91${phone_number}`,
        From: "whatsapp:+14155238886",
        Body: `Temporal.io has requested money from you on PhonePe. Rs.1477.50 /- will be debited from your account use OTP - ${otp}`,
    });

    const config: AxiosRequestConfig = {
        method: "post",
        maxBodyLength: Infinity,
        url: `https://api.twilio.com/2010-04-01/Accounts/AC9120b1ea3e55ee393e697847cedc2b67/Messages.json`,
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization:
                "Basic QUM5MTIwYjFlYTNlNTVlZTM5M2U2OTc4NDdjZWRjMmI2NzpkYWIyNjU2NTcwMWZlY2EyZDkyMTQ0MDAzYjc5YzNiMw==",
        },
        data: data,
        validateStatus: () => true,
    };

    const response: AxiosResponse = await axios.request(config);
    const response_body = response.data as TwilioWhatsappSendResponse;
    const status_code = response.status;

    if (status_code !== 201) {
        throw new Error(`Error from Whatsapp Service:${status_code}`);
    }

    return status_code;
}

export async function notifyCustomer(phone_number: string, notifyMode: string) {
    const message: string = customerNotifications[notifyMode];

    const data = qs.stringify({
        To: `whatsapp:+91${phone_number}`,
        From: "whatsapp:+14155238886",
        Body: message,
    });

    const config: AxiosRequestConfig = {
        method: "post",
        maxBodyLength: Infinity,
        url: "https://api.twilio.com/2010-04-01/Accounts/AC9120b1ea3e55ee393e697847cedc2b67/Messages.json",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization:
                "Basic QUM5MTIwYjFlYTNlNTVlZTM5M2U2OTc4NDdjZWRjMmI2NzpkYWIyNjU2NTcwMWZlY2EyZDkyMTQ0MDAzYjc5YzNiMw==",
        },
        data: data,
        validateStatus: () => true,
    };

    const response: AxiosResponse = await axios.request(config);
    const response_body = response.data as TwilioWhatsappSendResponse;
    const status_code = response.status;

    if (status_code !== 201) {
        throw new Error(`Error from Whatsapp Service:${status_code}`);
    }

    return status_code;
}

export async function generateOTP(): Promise<string> {
    return Math.random()
        .toString(36)
        .substring(2, 2 + 6)
        .toUpperCase();
}

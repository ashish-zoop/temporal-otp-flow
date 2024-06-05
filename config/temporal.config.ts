import * as dotEnv from "dotenv";
dotEnv.config();

export const temporalConfig = {
    TEMPORAL_ADDRESS: process.env.TEMPORAL_ADDRESS,
    TEMPORAL_NAMESPACE: process.env.TEMPORAL_NAMESPACE,
    PROMETHEUS_TARGET_ADDRESS: process.env.PROMETHEUS_TARGET_ADDRESS,
};

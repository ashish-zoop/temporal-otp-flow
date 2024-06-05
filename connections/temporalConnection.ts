/* eslint-disable no-empty */
import {
    Client,
    Connection,
    Workflow,
    WorkflowClient,
    WorkflowNotFoundError,
} from "@temporalio/client";
import { temporalConfig } from "../config/temporal.config";

export class TemporalClient {
    private static instance: TemporalClient;
    private connection: Connection;

    constructor() {
        this.connection = null;
    }

    async getConnection() {
        if (!this.connection) {
            this.connection = await Connection.connect({
                address: temporalConfig.TEMPORAL_ADDRESS,
                tls: undefined,
            });
            console.info("Temporal Connection Created 🧬");
            /*            
                SA disabled during deployment - since search attribute created via cloud for namespace
                enabled after 1st couple run in local since search attributes get created already
                enabled during 1st run in local - to insert search attributes 
            */
        } else return this.connection;
    }

    public static getInstance() {
        if (!TemporalClient.instance) {
            TemporalClient.instance = new TemporalClient();
        }
        return TemporalClient.instance;
    }

    async getTemporalClient() {
        await this.getConnection();
        return new Client({
            connection: this.connection,
            namespace: temporalConfig.TEMPORAL_NAMESPACE,
        });
    }

    async getWfClient() {
        await this.getConnection();
        return new WorkflowClient({
            connection: this.connection,
            namespace: temporalConfig.TEMPORAL_NAMESPACE,
        });
    }

    async startWorkflow(
        workflow: Workflow,
        WfInput: Record<string, any>[],
        taskQueue: string,
        wfID: string,
        searchAttributes?: Record<string, any> //SearchAttributes
    ) {
        try {
            await this.getConnection();
            const workflowClient = new WorkflowClient({
                connection: this.connection,
                namespace: temporalConfig.TEMPORAL_NAMESPACE,
            });

            const handle = workflowClient.start(workflow, {
                args: WfInput,
                taskQueue: taskQueue,
                workflowId: wfID,
                searchAttributes: searchAttributes,
                //workflowTaskTimeout:
                /*               
                retry:{
                    //https://community.temporal.io/t/retrying-a-workflow-for-a-specific-error-scenario/274
                } */
            });
            return handle;
        } catch (error) {
            console.error({
                message: "Error while starting workflow",
                workflowId: wfID,
                err: error,
            });
            throw error;
        }
    }

    async queryWorkflow(workflowId: string, queryHandle: any) {
        await this.getConnection();
        const workflowClient = new WorkflowClient({
            connection: this.connection,
            namespace: temporalConfig.TEMPORAL_NAMESPACE,
        });
        try {
            const handle = workflowClient.getHandle(workflowId);
            return await handle.query(queryHandle);
        } catch (error) {
            if (error instanceof WorkflowNotFoundError) {
                throw new Error("Wf Not Found.");
            } else {
                console.error("Error in queryWf method", {
                    err: error,
                });
                throw error;
            }
        }
    }

    async signalWorkflow(
        workflowId: string,
        signalHandle: any,
        signalInput?: any
    ) {
        await this.getConnection();
        const workflowClient = new WorkflowClient({
            connection: this.connection,
            namespace: temporalConfig.TEMPORAL_NAMESPACE,
        });
        if (!signalInput) {
            signalInput = {};
        }
        try {
            const handle = workflowClient.getHandle(workflowId);
            return await handle.signal(signalHandle, signalInput);
        } catch (error) {
            if (error instanceof WorkflowNotFoundError) {
                throw new Error("Wf Not Found.");
            } else {
                throw error;
            }
        }
    }
}

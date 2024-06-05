import express, { NextFunction, Response } from "express";
import * as http from "http";
import { Request as IRequest } from "express";
import { apiRouter } from "./api/api.routes";
import * as bodyParser from "body-parser";
import cors from "cors";
//import * as compression from "compression";
// import { TemporalClient } from "./connection/temporalConnection";
import { cpus } from "os";
import { appConfig } from "./config/app.config";
import requestIp from "request-ip";
import { TemporalClient } from "./connections/temporalConnection";

interface ServerOpsResponse {
    success: boolean;
    result: any;
}

export class Server {
    private express: express.Application;
    private server: http.Server;
    private static readonly port = parseInt(appConfig.SERVER_PORT) || 8000; //init when server starts

    public static async connectDeps() {
        const temporalConn = await TemporalClient.getInstance().getConnection();

        console.info({
            message: "Connected all dependencies! 💯 ",
        });
    }

    constructor() {
        //setup gracefull shutdown mechanism
        this.setGracefullShutdown();
        //create an instance of express application
        this.express = express();
        //setup commong middlewares for all incoming requests
        this.setCommonMiddlewares();
        //setup exposed api routes
        this.setAPIRoutes();
        //setup global error handling middleware at the very end
        this.catchErrors();
        //setup all external deps

        //
        // process.env.UV_THREADPOOL_SIZE = String(cpus().length * 4);
    }

    public start(): ServerOpsResponse {
        try {
            //start an express server on port
            this.server = this.express.listen(Server.port, Server.startCB);
            this.registerServerEvents();

            //

            return {
                success: true,
                result: "ALL OK! 🧑‍🚀",
            };
        } catch (error) {
            console.error({
                message: "Error in start() method of Server class",
                err: error,
            });
            return {
                success: false,
                result: null,
            };
        }
    }

    public async stop() {
        try {
            console.info({
                message: "Server is gracefully shutting down【⏻】",
            });

            const temporalConn =
                await TemporalClient.getInstance().getConnection();

            const closeConnections = await Promise.allSettled([
                temporalConn.close(),
                //other deps below
            ]);

            //close server at last
            if (this.server) {
                this.server.close(Server.stopCB);
            }

            console.info("Server has been gracefully shutdown (-)", {
                closeConnections,
            });
        } catch (error) {
            console.error({
                message: "Error in stop() method of Server class",
                err: error,
            });
        } finally {
            console.info("Killing the process");
            process.exit(0); // kill the process, k8s will take care of restarting

            //we use code 0 for gracefull shutdowns i.e. willfull termination
            //we use code 1 for abnormal termination i.e. shutdown due to unexpected errors
        }
    }

    private registerServerEvents() {
        //TODO: gracefully handling or shutdown for each event

        this.server.on("listening", (data: any) => {
            console.info({
                message: "Server listening event triggered",
                data: data ?? "na",
            });
        });

        this.server.on("close", async () => {
            await this.stop();
        });

        this.server.on("error", async (error: any) => {
            console.error({
                message: "Error event on server instance",
                err: error,
            });
            await this.stop();
        });

        //TODO:
        // this.server.on("connect");
        // this.server.on("connection");
    }

    private setGracefullShutdown() {
        process.on("uncaughtException", async (error) => {
            console.error({
                message: "received uncaught exception",
                err: error,
            });
            await this.stop();
        });

        process.on("unhandledRejection", async (reason, promise) => {
            console.error({
                message: "received unhandled rejection",
                err: reason,
                promise,
            });
            await this.stop();
        });

        // Signal Interrupt - 2
        process.on("SIGINT", async (error: any) => {
            console.warn({
                message: "SIGINT Encountered:",
                err: error,
            });
            await this.stop();
        });
        // Sigal Terminate - 15
        process.on("SIGTERM", async (error: any) => {
            console.warn({
                message: "SIGTERM Encountered:",
                err: error,
            });
            await this.stop();
        });

        //TODO: SIGKILL
    }

    /*         
        global error handling middleware
        all usage of next(error) command direct here
        all errors rejected or thrown which are unhandled land up here 
    */
    private catchErrors(): void {
        this.express.use(
            (error: any, req: IRequest, res: Response, next: NextFunction) => {
                console.info("Caught in global error handling middleware", {
                    err: error,
                });
                return res.status(500).json({
                    message: "Internal error",
                    err: error,
                });
                //res.end();
            }
        );
    }

    private setAPIRoutes(): void {
        //catch all /pb routes
        this.express.use("/api", apiRouter);
        this.express.use("/healthz", (req: IRequest, res: Response) => {
            res.status(200).send("OK");
        });
        //catch-all middleware
        this.express.use(
            "*",
            (req: IRequest, res: Response, next: NextFunction) => {
                res.status(404).send({
                    message:
                        "You are trying to connect to an invalid endpoint. Please contact support@zoop.one",
                });
            }
        );
    }

    /*     
        sets up middlewares for all requests received by server
        each request passes through following middleware before being directed to any api route 
    */
    private setCommonMiddlewares(): void {
        this.express.use(cors());
        this.express.use(requestIp.mw());
        this.express.use((req: IRequest, res: Response, next: NextFunction) => {
            req["client_ip"] = requestIp.getClientIp(req);
            next();
        });
        // this.express.use(compression()); //giving error for now
        this.express.use(bodyParser.json({ limit: "80mb" }));
        this.express.use(
            bodyParser.urlencoded({ extended: true, limit: "80mb" })
        );

        // this.express.use(requestIp.mw());

        //TODO: bodyparser above vs this inbuilt express below
        // this.express.use(express.json());
        // this.express.use(express.urlencoded({ extended: true }));

        //TODO: explore these
        //busboy
        //busboy-body-parser
        //multer
        //morgan
        //express-rate-limiter
        //csurf
        //helmet
        //headrush
        //reative order in which they all should be called - order is imp in middlewares

        //TODO: More to include with time
        //cors
        //morgan
        //fileUpload-express
        //multer
    }

    private static startCB = (error?: any) => {
        console.info({
            message: `API Server Live at port: ${Server.port}! 📡🚀`,
        });
        if (error) {
            console.error({
                message: `Error while starting API Server`,
                err: error,
            });
        }
    };

    private static stopCB = (error?: any) => {
        console.info({
            message: `Stopping API Server! ⛔`,
        });
        if (error) {
            console.error({
                message: `Error while stopping API Server`,
                err: error,
            });
        }
    };
}

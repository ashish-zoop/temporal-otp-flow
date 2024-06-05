import { Server } from "./server";

//top-level awaits not allows hence promise chains
Server.connectDeps()
    .then(async () => {
        //only when all external dependencies connected succesfully - initiate server start

        const Service = new Server();
        const { success, result } = Service.start();
        if (!success) {
            await Service.stop();
            return;
        }
        console.info("Hello, Server is up", { result });
    })
    .catch((error) => {
        //if any error during dependency connection - log & kill process

        console.error({
            messag: "Error in connection dependencies",
            err: error,
        });
        console.info("Killing the process!");
        process.exit(1);
    })
    .finally(() => {
        console.info("STUB");
    });

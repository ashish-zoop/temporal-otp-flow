import dotenv from "dotenv";
dotenv.config();

/* 
    When we run this in a container orchestration system like Kubernetes, these
    variables will be available already and we don't need to load then by libraries
    like dotenv. If you already have an environment file like (i.e. .env) you can
    load then by running the command mentioned below 
*/

// export $(grep -v '^#' .env | xargs -0) for more info https://stackoverflow.com/a/20909045

export const appConfig = {
    ENV: process.env.ENV as "develop" | "production" | "staging" | "local",
    SERVER_PORT: process.env.SERVER_PORT,
};

export const trimString = (str: string) => {
    try {
        return str.replace(/\r?\n|\r/g, "");
    } catch (error) {
        return str;
    }
};

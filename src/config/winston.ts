import * as winston from "winston"
import * as winstonRotate from "winston-daily-rotate-file"
import dotenv from "dotenv"
import * as appRoot from "app-root-path"
import moment from "moment"
const month = moment().format("MM")
const year = moment().format("YYYY")
const day = moment().format("DD")
dotenv.config()
winstonRotate


const transports = {
    error: new winston.transports.DailyRotateFile({
        filename: `${appRoot}/../logs/${process.env.NAME_PROGRAM}/error/%DATE%.log`,
        datePattern: "YYYY-MM-DD-HH",
        zippedArchive: true,
        maxFiles: "14d",
        maxSize: "100m",
        frequency: "1h",
        level: "error",
    }),
    combine: new winston.transports.DailyRotateFile({
        filename: `${appRoot}/../logs/${process.env.NAME_PROGRAM}/combine/%DATE%.log`,
        datePattern: "YYYY-MM-DD-HH",
        zippedArchive: true,
        maxFiles: "14d",
        maxSize: "100m",
        frequency: "1h"
    }),
    console: new winston.transports.Console({
        format: winston.format.simple()
    }),
    extraLog: new winston.transports.DailyRotateFile({
        filename: `${appRoot}/../logs/${process.env.NAME_PROGRAM}/extra/%DATE%.log`,
        datePattern: "YYYY-MM-DD-HH",
        zippedArchive: true,
        maxFiles: "14d",
        maxSize: "100m",
        frequency: "1h"
    }),
}

export const combineOpt = winston.createLogger({
    format: winston.format.combine(
        winston.format.timestamp({
            format: "DD-MM-YYYY HH:mm:ss",
        }),
        winston.format.json()
    ),
    transports: process.env.NODE_ENV == "development" ? [transports.console] : [transports.combine,transports.error],
})

export const errorOpt = winston.createLogger({
    format: winston.format.combine(
        winston.format.timestamp({
            format: "DD-MM-YYYY HH:mm:ss",
        }),
        winston.format.json(),
        winston.format.colorize()
    ),
    transports: process.env.NODE_ENV == "development" ? [transports.console] : [transports.error]
})

export const extraLog = winston.createLogger({
    format: winston.format.combine(
        winston.format.timestamp({
            format: "DD-MM-YYYY HH:mm:ss",
        }),
        winston.format.json()
    ),
    transports: process.env.NODE_ENV == "development" ? [transports.console] : [transports.extraLog,transports.error]
})
import mysql from "mysql2"

const connection = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    multipleStatements: true
});
connection.getConnection((err: any, connection: any) => {
    if (err) {
        if (err.code === "PROTOCOL_CONNECTION_LOST") {
            console.error(`Database ${process.env.DB_NAME} connection was closed.`);
        }
        if (err.code === "ER_CON_COUNT_ERROR") {
            console.error(`Database ${process.env.DB_NAME} has too many connections.`);
        }
        if (err.code === "ECONNREFUSED") {
            console.error(`Database ${process.env.DB_NAME} connection was refused.`);
        } else {
            console.error(`Database ${process.env.DB_NAME} ${err.code}.`);
        }
    }
    if (connection) {
        console.log(`database ${process.env.DB_NAME} connected`);
        connection.release();
    }
    return;
});

export default connection

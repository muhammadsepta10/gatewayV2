const mysql = require("mysql2");

const connection = mysql.createPool({
    host: process.env.DB_HOST3,
    user: process.env.DB_USER3,
    password: process.env.DB_PASS3,
    database: process.env.DB_NAME3,
    multipleStatements: true,
});
connection.getConnection((err: any, connection: any) => {
    if (err) {
        if (err.code === "PROTOCOL_CONNECTION_LOST") {
            console.error(`Database ${process.env.DB_NAME3} connection was closed.`);
        }
        if (err.code === "ER_CON_COUNT_ERROR") {
            console.error(`Database ${process.env.DB_NAME3} has too many connections.`);
        }
        if (err.code === "ECONNREFUSED") {
            console.error(`Database ${process.env.DB_NAME3} connection was refused.`);
        } else {
            console.error(`Database ${process.env.DB_NAME3} ${err.code}.`);
        }
    }
    if (connection) {
        console.log(`database ${process.env.DB_NAME3} connected`);
        connection.release();
    }
    return;
});

export default connection

import * as dotenv from 'dotenv';
dotenv.config()

const swaggerJsDoc = require("swagger-jsdoc");

const options = {
    apis: ["src/controllers/**/*.ts"],
    basePath: "/",
    swaggerDefinition: {
        openapi: "3.0.2",
        info: {
            title: "Documentation API RedBox",
            description: `${process.env.NAME_PROGRAM}_API`,
            swagger: "2.0",
            version: "1.0.0",
            contact: {
                name: "Developer",
                email: "REDBOX@missiidea.com"
            },
            license: {
                name: "Apache 2.0",
                url: "https://www.apache.org/licenses/LICENSE-2.0.html"
            },
        },
        components: {
            securitySchemes: {
                ApiKeyAuth: {
                    type: "apiKey",
                    in: "header",
                    name: "auth-token"
                }
            }
        }
    }
};

export const specs = swaggerJsDoc(options)

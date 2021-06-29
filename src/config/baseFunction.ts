import connection from "../config/db"
import connection2 from "../config/dbCoupon"
import connection3 from "../config/logConnection"
import moment from "moment"
import fs from "fs"
import { google } from "googleapis"
import { config } from "dotenv"
config()
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ""
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ""
const GOOGLE_ACCESS_TOKEN = process.env.GOOGLE_ACCESS_TOKEN || ""
const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN || ""
const { OAuth2 } = google.auth
const oAuth2Client = new OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET
)
oAuth2Client.setCredentials({
    refresh_token: GOOGLE_REFRESH_TOKEN,
    access_token: GOOGLE_ACCESS_TOKEN
})
const people = google.people({
    version: "v1", auth: oAuth2Client
})
export const query = (sql: any, args: any) => {
    return new Promise<any>((resolve, reject) => {
        connection.query(sql, args, (err: any, rows: any) => {
            if (err) {
                return reject({
                    sql,
                    args,
                    err
                });
            } else {
                return resolve(rows);
            }
        });
    });
};

export const saveContact = (name: string, phoneNumber: string) => {
    return new Promise(async (resolve, reject) => {
        try {
            const searchContact = await people.people.searchContacts({
                query: phoneNumber,
                readMask: "phoneNumbers"
            })
            const lengthContact = searchContact.data?.results ?? 0
            if (lengthContact < 1) {
                await people.people.createContact({
                    requestBody: {
                        names: [
                            {
                                displayName: name

                            },
                        ],
                        phoneNumbers: [{ value: phoneNumber }]
                    },
                });
            }
            return resolve(true)
        } catch (error) {
            reject(error)
        }
    })
}

export const query2 = (sql: any, args: any) => {
    return new Promise<any>((resolve, reject) => {
        connection2.query(sql, args, (err: any, rows: any) => {
            if (err) {
                return reject({
                    sql,
                    args,
                    err
                });
            } else {
                return resolve(rows);
            }
        });
    });
};

export const query3 = (sql: any, args: any) => {
    return new Promise<any>((resolve, reject) => {
        connection3.query(sql, args, (err: any, rows: any) => {
            if (err) {
                return reject({
                    sql,
                    args,
                    err
                });
            } else {
                return resolve(rows);
            }
        });
    });
};

export const arrObjToObj = (arrObj: any, key: string, value: string) => {
    return new Promise<{}>((resolve, reject) => {
        let obj: any = {}
        for (let i = 0; i < arrObj.length; i++) {
            const name = arrObj[i][key]
            const lala = arrObj[i][value]
            obj[name] = lala
        }
        resolve(obj)
    })
}


export const randomString = async (length: number, chars: string, frontText: string) => {
    var result = `${frontText}`;
    const rand = (char: string) => {
        let result = ``
        for (var i = char.length + frontText.length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
        return result;
    }
    const afterRand: string = frontText + await rand(chars)
    for (var i = length - (frontText.length); i > 0; --i) result += afterRand[Math.floor(Math.random() * afterRand.length)];
    return result;
}

export const writeFileSyncRecursive = (filename: string, content: any) => {
    return new Promise((resolve, reject) => {
        try {
            let filepath = filename.replace(/\\/g, '/');
            let root = '';
            if (filepath[0] === '/') {
                root = '/';
                filepath = filepath.slice(1);
            }
            else if (filepath[1] === ':') {
                root = filepath.slice(0, 3);
                filepath = filepath.slice(3);
            }
            const folders = filepath.split('/').slice(0, -1);
            folders.reduce(
                (acc, folder) => {
                    const folderPath = acc + folder + '/';
                    if (!fs.existsSync(folderPath)) {
                        fs.mkdirSync(folderPath);
                    }
                    return folderPath
                },
                root
            );
            fs.writeFileSync(root + filepath, content);
            resolve(1)
        } catch (error) {
            reject(error)
        }
    })
}


export const validateRequestQuery = (data: any, type: string) => {
    let clearData: any = "";
    switch (type) {
        case "num":
            clearData =
                data == undefined ||
                    data == null ||
                    data == "undefined" ||
                    data == "null" ||
                    data == "" ||
                    data == ","
                    ? ""
                    : parseInt(data.toString().replace(/[^0-9]+/g, "")) == NaN
                        ? ""
                        : data.toString().replace(/[^0-9]+/g, "").trim();
            return clearData;
        case "char":
            clearData =
                data == undefined ||
                    data == null ||
                    data == "undefined" ||
                    data == "null" ||
                    data == "" ||
                    data == ","
                    ? ""
                    : data
                        .toString()
                        .replace(/[^a-z\d\s]+/gi, "")
                        .toUpperCase().trim();
            return clearData;
        case "numChar":
            clearData =
                data == undefined ||
                    data == null ||
                    data == "undefined" ||
                    data == "null" ||
                    data == "" ||
                    data == ","
                    ? ""
                    : data
                        .toString()
                        .replace(/[^a-zA-Z0-9]/g, "")
                        .toUpperCase().trim();
            return clearData;
        case "charSpace":
            clearData =
                data == undefined ||
                    data == null ||
                    data == "undefined" ||
                    data == "null" ||
                    data == "" ||
                    data == ","
                    ? ""
                    : data
                        .toString()
                        .replace(/[^a-zA-Z ]/g, "")
                        .toUpperCase().trim();
            return clearData;
        case "numCharSpace":
            clearData =
                data == undefined ||
                    data == null ||
                    data == "undefined" ||
                    data == "null" ||
                    data == "" ||
                    data == ","
                    ? ""
                    : data
                        .toString()
                        .replace(/[^\w\s]/gi, "")
                        .toUpperCase().trim();
            return clearData;
        case "any":
            clearData =
                data == undefined ||
                    data == null ||
                    data == "undefined" ||
                    data == "null" ||
                    data == "" ||
                    data == ","
                    ? ""
                    : data;
            return clearData;
        case "rcvd":
            clearData =
                moment(data, "YYYY-MM-DD").format("YYYY-MM-DD").toUpperCase() === "INVALID DATE"
                    ? ""
                    : moment(data).format("YYYY-MM-DD");
            return clearData;
        case "rcvdTime":
            clearData =
                moment(data, "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss").toUpperCase() === "INVALID DATE"
                    ? ""
                    : moment(data).format("YYYY-MM-DD HH:mm:ss");
            return clearData;
        default:
            clearData = null;
            return clearData;
    }
};


export const parsingFormat = (message: string, keyword: string) => {
    return new Promise((resolve, reject) => {
        try {
            // format 1 = "OREO NAMA#No.KTP#No.HP#Kota"
            const formatType = message.toUpperCase().search(keyword + " ") < 0 && message.split("#").length == 4 ? 2 : 1
            const format = formatType == 1 ? message.substring(message.search(" ")).split("#") : message.substring(message.toUpperCase().search(keyword + "#")).split("#")
            if (formatType == 1) {
                const formatKey = validateRequestQuery(message.substring(0, message.search(" ")), "char")
                const name = format.length < 1 ? "" : validateRequestQuery(format[0], "numCharSpace").substr(0, 100)
                const identity = format.length < 2 ? "" : validateRequestQuery(format[1], "num").substr(0, 20)
                const hp = format.length < 3 ? "" : validateRequestQuery(format[2], "num").substr(0, 20)
                const city = format.length < 4 ? "" : validateRequestQuery(format[3], "charSpace").substr(0, 50)
                if (keyword != formatKey) {
                    return resolve({
                        type: 1,
                        success: 0,
                        status: 400,
                        data: {
                            name: "",
                            hp: "",
                            city: "",
                            identity: ""
                        },
                    });
                }
                else if (format.length != 4) {
                    return resolve({
                        type: 1,
                        success: 0,
                        status: 201,
                        data: {
                            name: name,
                            hp: hp,
                            city: city,
                            identity: identity
                        },
                    })
                }
                else if (name == "" || hp == "" || city == "" || identity == "") {
                    return resolve({
                        type: 1,
                        success: 0,
                        status: 404,
                        data: {
                            name: name,
                            hp: hp,
                            city: city,
                            identity: identity
                        },
                    });
                } else {
                    return resolve({
                        type: 1,
                        success: 1,
                        status: 200,
                        data: {
                            name: name,
                            hp: hp,
                            city: city,
                            identity: identity
                        },
                    });
                }
            } else {
                const formatKey = format.length < 1 ? "" : validateRequestQuery(format[0], "numCharSpace").substr(0, 10)
                const name = format.length < 1 ? "" : validateRequestQuery(format[1], "charSpace").substr(0, 100)
                const identity = format.length < 1 ? "" : validateRequestQuery(format[2], "num").substr(0, 20)
                const hp = format.length < 1 ? "" : validateRequestQuery(format[3], "num").substr(0, 20)
                const city = format.length < 1 ? "" : validateRequestQuery(format[4], "charSpace").substr(0, 50)
                if (keyword != formatKey) {
                    return resolve({
                        type: 2,
                        success: 0,
                        status: 400,
                        data: {
                            transaction_code: "",
                            name: "",
                            identity: "",
                            hp: "",
                            city: "",
                        },
                    });
                }
                else if (name == "" || hp == "" || city == "" || identity == "") {
                    return resolve({
                        type: 2,
                        success: 0,
                        status: 404,
                        data: {
                            name: name,
                            identity: identity,
                            hp: hp,
                            city: city
                        },
                    });
                } else {
                    return resolve({
                        type: 2,
                        success: 1,
                        status: 200,
                        data: {
                            name: name,
                            identity: identity,
                            hp: hp,
                            city: city
                        },
                    });
                }
            }
        } catch (error) {
            reject(error)
        }
    })
};

export const parsingIdentity = (identity: string) => {
    return new Promise(async (resolve, reject) => {
        try {
            const clearIdentity = identity.replace(/\D/g, "")
            if (clearIdentity.length != 16) {
                resolve({
                    identity: clearIdentity,
                    idType: 0,
                    province: 0,
                    regency: 0,
                    district: 0,
                    gender: "",
                    birthdate: "0000-00-00",
                    age: 0
                })
            } else {
                const codeAre = clearIdentity.substring(0, 6)
                const codeProvince = clearIdentity.substring(0, 2)
                const codeRegncy = clearIdentity.substring(0, 4)
                const codeDistrict = clearIdentity.substring(0, 6)
                const bornDate = parseInt(clearIdentity.substring(6, 8)) > 40 ? parseInt(clearIdentity.substring(6, 8)) - 40 : clearIdentity.substring(6, 8);
                const gender = clearIdentity == "" ? "" : parseInt(clearIdentity.substring(6, 8)) > 40 ? "F" : parseInt(clearIdentity.substring(6, 8)) < 40 ? "M" : "";
                const yearNow = String(new Date().getFullYear()).substring(2, 4);
                const bornYear = parseInt(clearIdentity.substring(10, 12)) > parseInt(yearNow) ? 19 : 20;
                let birthDate = clearIdentity.length < 16 || parseInt(clearIdentity.substring(8, 10)) > 12 || bornDate > 31 ? "0000-00-00" : bornYear + clearIdentity.substring(10, 12) + "-" + clearIdentity.substring(8, 10) + "-" + bornDate;
                birthDate = moment(birthDate).isValid() ? birthDate : "0000-00-00"
                // const ages = moment(birthDate, "YYYY").fromNow().replace(" years ago" || " months ago" || " days ago", "");
                const ages = moment(birthDate).isValid() ? moment().diff(birthDate, 'years', false).toString() : "Invalid date"
                const age = ages === "Invalid date" ? "0" : ages.length > 2 ? "0" : birthDate == null ? "0" : ages;
                const area: any = await query("SELECT province,regency,district FROM vw_code_ktp WHERE code= ?", [codeAre])
                if (area.length < 1 || birthDate == "0000-00-00") {
                    resolve({
                        identity: clearIdentity,
                        idType: 0,
                        province: 0,
                        regency: 0,
                        district: 0,
                        gender: gender,
                        birthdate: birthDate,
                        age: age
                    })
                } else {
                    resolve({
                        identity: clearIdentity,
                        idType: 1,
                        province: codeProvince,
                        regency: codeRegncy,
                        district: codeDistrict,
                        gender: gender,
                        birthdate: birthDate,
                        age: age
                    })
                }
            }
        } catch (error) {
            reject(error)
        }
    })
}


export const vlaidateHp = (hp: string) => {
    return new Promise<string>((resolve, reject) => {
        try {
            if (hp.length < 6) {
                resolve("")
            } else {
                if (hp.substring(0, 2) == "62") {
                    resolve(hp)
                } else if (hp.substring(0, 2) == "08") {
                    resolve(`62${hp.substring(1)}`)
                } else {
                    resolve(hp)
                }
            }
        } catch (error) {
            reject(error)
        }
    })
}


export const checkOperator = (hp: string) => {
    return new Promise<string>(async (resolve, reject) => {
        try {
            const hpValidasi: any = await vlaidateHp(hp)
            const subStringHp = hpValidasi.substring(0, 5);
            if (
                subStringHp == "62859" ||
                subStringHp == "62877" ||
                subStringHp == "62878" ||
                subStringHp == "62817" ||
                subStringHp == "62818" ||
                subStringHp == "62819"
            ) {
                return resolve("XL");
            } else if (
                subStringHp == "62811" ||
                subStringHp == "62812" ||
                subStringHp == "62813" ||
                subStringHp == "62821" ||
                subStringHp == "62822" ||
                subStringHp == "62823" ||
                subStringHp == "62852" ||
                subStringHp == "62853" ||
                subStringHp == "62851"
            ) {
                return resolve("TELKOMSEL");
            } else if (
                subStringHp == "62898" ||
                subStringHp == "62899" ||
                subStringHp == "62895" ||
                subStringHp == "62896" ||
                subStringHp == "62897"
            ) {
                return resolve("TRI");
            } else if (
                subStringHp == "62814" ||
                subStringHp == "62815" ||
                subStringHp == "62816" ||
                subStringHp == "62855" ||
                subStringHp == "62856" ||
                subStringHp == "62857" ||
                subStringHp == "62858"
            ) {
                return resolve("INDOSAT");
            } else if (
                subStringHp == "62889" ||
                subStringHp == "62881" ||
                subStringHp == "62882" ||
                subStringHp == "62883" ||
                subStringHp == "62886" ||
                subStringHp == "62887" ||
                subStringHp == "62888" ||
                subStringHp == "62884" ||
                subStringHp == "62885"
            ) {
                return resolve("SMARTFREN");
            } else if (
                subStringHp == "62832" ||
                subStringHp == "62833" ||
                subStringHp == "62838" ||
                subStringHp == "62831"
            ) {
                return resolve("AXIS");
            } else {
                return resolve("XL");
            }
        } catch (error) {
            reject(error)
        }
    })
};

export const getRandomInt = (min: number, max: number) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const crackAlfamartCode = (function () {

    var table: any = []
    for (var i = 0; i < 256; i++) {
        var c = i
        for (var j = 0; j < 8; j++) {
            c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
        }
        table.push(c)
    }

    return function (str: any, crc: any) {
        str = unescape(encodeURIComponent(str))
        if (!crc) crc = 0
        crc = crc ^ (-1)
        for (var i = 0; i < str.length; i++) {
            var y: any = (crc ^ str.charCodeAt(i)) & 0xff
            crc = (crc >>> 8) ^ table[y]
        }
        crc = crc ^ (-1)
        let dechex = parseInt((crc >>> 0).toString(), 10).toString(16).toUpperCase()

        if (dechex.length < 8) {
            const length = 8 - dechex.length
            for (let index = 0; index < length; index++) {
                dechex = '0' + dechex
            }
        }

        return dechex

        // return parseInt((crc >>> 0).toString(), 10).toString(16).toUpperCase()
        // return crc >>> 0
    }

})()

export const checkExtension = (filename: string) => {
    switch ((((filename.split("."))[filename.toString().split(".").length - 1]).toUpperCase())) {
        case "JPG":
            return "JPG"
            break;
        case "JPEG":
            return "JPEG"
            break;
        case "PNG":
            return "PNG"
            break;
        case "GIF":
            return "GIF"
            break;
        case "TIFF":
            return "TIFF"
            break;
        case "PSD":
            return "PSD"
            break;
        case "PDF":
            return "PDF"
            break;
        case "EPS":
            return "EPS"
            break;
        case "AI":
            return "AI"
            break;
        case "INDD":
            return "INDD"
            break;
        case "RAW":
            return "RAW"
            break;
        default:
            return ""
            break;
    }
}

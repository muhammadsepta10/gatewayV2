import { MessageType, WAConnection, WAConnectOptions } from '@adiwajshing/baileys'
import axios from 'axios'
import fs from "fs"
import bull from "bull"
import moment from 'moment'
import appRoot from "app-root-path"
import express,{NextFunction, Request,Response} from "express"
import cors from "cors"
import dotenv from "dotenv"
import * as winstonOpt from "./config/winston"
import { BullAdapter } from 'bull-board/bullAdapter'
import { createBullBoard } from "bull-board"
import { saveContact, validateRequestQuery, vlaidateHp, writeFileSyncRecursive } from './config/baseFunction'
dotenv.config()
const credentialPath = `${appRoot}/auth_info.json`
const validasiQueue = new bull("Validasi Queue", "redis://127.0.0.1:6379")
const replyQueue = new bull("Reply Queue", "redis://127.0.0.1:6379")
const {router}=createBullBoard([
    new BullAdapter(validasiQueue),
    new BullAdapter(replyQueue)
])

const app = express()
const port = process.env.PORT
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors())
app.use('/admin/queues', router)
app.use(express.static(`${appRoot}/media`))
app.use(function (err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
    winstonOpt.errorOpt
    res.status(500).send({ message: "ERROR!!", data: {} })
})
app.listen(port, () => console.log(`API ${process.env.NAME_PROGRAM} Connected on Port ${port}`))

const connectToWhatsApp = async ()=> {
    try {
        // Route Api
        app.post("/api/push",async(req:Request,res:Response)=>{
            try {
                let sender = await vlaidateHp(req.body.sender)
                const message = req.body.message
                if (!sender||!message||message=="") {
                    return res.status(400).send({message:"Parameter not valid",data:{}})
                }
                sender+="@s.whatsapp.net"
                await replyQueue.add({sender:sender,reply:message})
                return res.send("OK")
            } catch (error) {
                winstonOpt.extraLog.error({ message: "Error to Push", error: error })
                return res.send({Message:"Error"}).status(500)
            }
        })

        // bull queue
        validasiQueue.process(data=>{
            return callWebHook(data.data)
        })
        validasiQueue.on("completed",data=>{
            return replyQueue.add({sender:data.returnvalue.sender,reply:data.returnvalue.reply})
        })
        replyQueue.process(data=>{
            return sendReply(data.data.sender,data.data.reply)
        })
        
        // send Reply
        const sendReply = async(remoteJid:string,replyText:string)=>{
            if (replyText!=="" && replyText) {
                await conn.sendMessage(remoteJid,replyText,MessageType.text)
            }
        }


        const conn = new WAConnection()

        // option

        conn.setMaxListeners(0)
        conn.version = [2, 2119, 6]
        if (fs.existsSync(credentialPath)) {
            conn.loadAuthInfo(credentialPath)
        }
        conn.on('open', () => {
            // save credentials whenever updated
            const authInfo = conn.base64EncodedAuthInfo() 
            fs.writeFileSync('./auth_info.json', JSON.stringify(authInfo)) // save this info to a file
        })
        conn.on("close",()=>{
            fs.unlinkSync(credentialPath)
            throw new Error("Connection Closed")
        })
        await conn.connect()

        // unread Process
        conn.on('chats-received', async ({ hasNewChats }) => {
            const unread = await conn.loadAllUnreadMessages()
            for (let index = 0; index < unread.length; index++) {
                const message = unread[index]
                console.log(message)
                const remoteJid = message?.key?.remoteJid||""
                const messageId = message.key.id
                let messageText = message.message?.conversation||""
                const timestamp = moment.unix(+message.messageTimestamp).format("YYYY-MM-DD HH:mm:ss")
                const sender = validateRequestQuery(remoteJid,"num")
                let filename = undefined
                if (message.message?.imageMessage) {
                    // decrypt image
                    if(message.message.imageMessage?.caption) messageText=message.message.imageMessage?.caption
                    const ext = message.message.imageMessage.mimetype?.split("/")[1]
                    filename = `${message.messageTimestamp}.${ext}`
                    const pathFile = `/${sender}/${filename}`
                    const buffer = await conn.downloadMediaMessage(message) // to decrypt & use as a buffer
                    writeFileSyncRecursive(`${appRoot}/media${pathFile}`,buffer)
                }
                if (messageText!=""&&messageText) {
                    validasiQueue.add({
                        message:messageText,
                        sender:remoteJid,
                        rcvdTime:timestamp,
                        filename:filename
                    })
                }
                await conn.chatRead(remoteJid)
            }
        })

        // on notif whatsapp
        conn.on('chat-update', async chatUpdate => {
            if (chatUpdate.messages && chatUpdate.count) {
                const message = chatUpdate.messages.all()[0]
                const remoteJid = message?.key?.remoteJid||""
                const messageId = message.key.id
                let messageText = message.message?.conversation||""
                const timestamp = moment.unix(+message.messageTimestamp).format("YYYY-MM-DD HH:mm:ss")
                const sender = validateRequestQuery(remoteJid,"num")
                let filename = undefined
                if (message.message?.imageMessage) {
                    // decrypt media
                    if(message.message.imageMessage?.caption) messageText=message.message.imageMessage?.caption
                    const ext = message.message.imageMessage.mimetype?.split("/")[1]
                    filename = `${message.messageTimestamp}.${ext}`
                    const pathFile = `/${sender}/${filename}`
                    const buffer = await conn.downloadMediaMessage(message) // to decrypt & use as a buffer
                    writeFileSyncRecursive(`${appRoot}/media${pathFile}`,buffer)
                }
                if (messageText!=""&&messageText) {
                    validasiQueue.add({
                        message:messageText,
                        sender:remoteJid,
                        rcvdTime:timestamp,
                        filename:filename
                    })
                }
                await conn.chatRead(remoteJid)
            } else {
                const presences:any = chatUpdate.presences
                const jid:any = chatUpdate.jid
                const lastKnownPresence = presences?presences[jid]?.lastKnownPresence:""
                const name = presences?presences[jid]?.name:""
                console.log(`${name} =>  ${lastKnownPresence=="composing"?"Typing":"Close Typing"}`)
            }
        })
    } catch (error) {
        winstonOpt.combineOpt.error({message:"Error on gateway connection",error})
        console.log("whatsapp Error", error)
    }
}

const callWebHook = (param:{message:string,sender:string,rcvdTime:string,filename:string})=>{
    return new Promise<{sender:string,reply:string}>(async(resolve,reject)=>{
        const senderReal = param.sender.replace(/[^0-9]/g, '')
        let reply = ""
        await saveContact(senderReal,senderReal)
        await axios.post("http://localhost:5001/api/v1/validasi",{
            pesan:Buffer.from(param.message).toString("base64"),
            nomor_pengirim:senderReal,
            timestamp:param.rcvdTime,
            media:"300"
        }).then(res=>{
            reply = res.data.message
            return resolve({sender:param.sender,reply})
        }).catch(error=>{
            winstonOpt.combineOpt.error({message:"Error to validasi",error})
            reject(error)
        })
    })
}

connectToWhatsApp().catch(error=>{
    winstonOpt.combineOpt.error({message:"Error on gateway connection",error})
    console.log("whatsapp Error", error)
})
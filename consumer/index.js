const express=require('express');
const Redis=require('ioredis');
const bodyParser=require('body-parser')
const cors=require('cors');
const http = require('http');
const { Server } = require("socket.io");

const client=new Redis({
    host: 'localhost',
    port: 6379,
});
const streamName='mystream';
const groupName='consumerGroup';

const start=()=>{
    const app=express();
    const server = http.createServer(app);
    const io = new Server(server,{
        cors:{
            origin:"*"
        }
    });
    app.use(bodyParser.json());
    app.use(cors({
        origin:"*"
        
    }))
    io.on('connection', (socket) => {
        console.log('a user connected');
      });
   
  const createConsumerGroup=async()=>{
    const groupInfo=await client.xinfo('GROUPS',streamName);
    console.log("groupInfo+++",groupInfo);
    if(!groupInfo.length>0){
        client.xgroup("CREATE",streamName,groupName,"$",(err)=>{
            if(err){
                console.log(err);
            }
            else{
                console.log("done");

                listenToMessages();
            }
        })
    }
    else{
         listenToMessages();

    }
  }
  createConsumerGroup();
  const listenToMessages=async()=>{
   
    client.xreadgroup('GROUP',groupName,'CONSUMERNAME','BLOCK','10000','STREAMS',streamName,'>',function(err,result){
        if(err){
            console.log("Redis++++++",err);
            setTimeout(()=>{
                listenToMessages();

            },1000);
        
        }
        console.log("result",result);
        if(result && result.length>0){
            const stream=result[0];
            const messageId=stream[1][0][0];
            const message=stream[1][0][1];
            console.log("message+++++++",messageId,message[0],message[1]);
            client.xack(streamName,groupName,messageId,async(err)=>{
                if(err){
                    console.log('Message not processed')
                }
                else{
                    const data=await client.hgetall(message[0])
                    data.score=Number(data.score)+Number(message[1]);
                    await client.hset(message[0],data);
                    io.emit("playerEvent",data);
                }
                listenToMessages();
            });

        }
        else{
        
                listenToMessages();

        
        }
     

    })

  }

 app.get("/",(req,res)=>{
    return res.json({
        message:"ok"
    })
 })
  
    server.listen(5000,()=>{
        console.log('server is listening on the PORT 5000');
         

    })
}
start();


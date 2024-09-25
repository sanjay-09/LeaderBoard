const express=require('express');
const Redis=require('ioredis');
const bodyParser=require('body-parser')
const cors=require('cors');
const client=new Redis({
    host: 'localhost',
    port: 6379,
});
const streamName='mystream'
const start=()=>{
    const app=express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended:true}))
    app.use(cors({
        origin:"*"
        
    }))

    app.post("/addPlayer",async(req,res)=>{
        console.log(req.body);
        
            const {playerId}=req.body;
            try{
                await client.hset(`players-${playerId}`,req.body);
               const data=await client.hgetall(`players-${playerId}`);
                return res.status(200).json({
                    data:data,
                    message:'Added the player'
                })

            }



        
        catch(err){
            console.log(err);
            return res.status(500).json({

            })

        }
    })
    app.post("/processData",async(req,res)=>{
        const data=req.body;
        try{
            console.log(req.body);
            await client.xadd(streamName,"*",`players-${data.playerId}`,data.score);
            return res.status(200).json({
                message:'Player added succesfully'
            })


        }
        catch(err){
            return res.status(500).json({
                message:'Error in adding the player'
            })

        }


    })

    app.listen(4000,()=>{
        console.log('server is listening on the PORT 4000');
         

    })
}
start();


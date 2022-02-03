const express = require('express')
const app = express()
const port = 3000
const bodyParser = require('body-parser');

const config = require('./config/key');
const {User} = require("./models/User");
// 클라이언트에서 오는 정보를 서버에서 분석해서 가져올 수 있게해주는 module : bodyParser

//application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: true}));
//application/json
app.use(bodyParser.json());


const mongoose = require('mongoose');
mongoose.connect(config.mongoURI).then(() => console.log('MongoDB Connected...'))
    .catch(err => console.log(err));


app.get('/', (req, res) => res.send('하하호호.'));

app.post('/register',(req,res) =>{

    //회원 가입 할 때 필요한 정보들을 client에서 가져오면
    //그것들을 데이터베이스에 넣어준다.

    const user = new User(req.body);
    user.save((err,doc) =>{
        if(err) return res.json({success : false , err});
        return res.status(200).json({
            success:true
        });
    }); // save() -> mongoDB 메서드 저장

});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));

const express = require('express')
const app = express()
const port = 3000
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const config = require('./config/key');
const {User} = require("./models/User");
const {auth} = require('./middleware/auth');
// 클라이언트에서 오는 정보를 서버에서 분석해서 가져올 수 있게해주는 module : bodyParser

//application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: true}));
//application/json
app.use(bodyParser.json());
app.use(cookieParser());

const mongoose = require('mongoose');
mongoose.connect(config.mongoURI).then(() => console.log('MongoDB Connected...'))
    .catch(err => console.log(err));


app.get('/', (req, res) => res.send('하하호호.'));

app.post('api/users/register',(req,res) =>{

    //회원 가입 할 때 필요한 정보들을 client에서 가져오면
    //그것들을 데이터베이스에 넣어준다.

    const user = new User(req.body);
    user.save((err,userInfo) =>{
        if(err) return res.json({success : false , err});
        return res.status(200).json({
            success:true
        });
    }); // save() -> mongoDB 메서드 저장
});

app.post('api/users/login', (req,res) =>{

    //요청된 이메일을 데이터베이스에서 있는지 찾는다.
    User.findOne({email:req.body.email},(err,user) => {
       if(!user) {
           return res.json({
               loginSuccess:false,
               message:"제공된 이메일에 해당하는 유저가 없습니다."
           });
       }
        //요청한 이메일이 데이터베이스에 있다면 비밀번호가 맞는지 확인
        user.comparePassword(req.body.password ,(err , isMatch) => {
            if(!isMatch)
            return res.json({loginSuccess:false , message : "비밀번호가 틀렸습니다."})

            //비밀번호까지 맞다면 Token 생성
            user.generateToken((err,user) => {
                if(err) return res.status(400).send(err);

                // 토큰을 저장한다. 어디에? 1)쿠키 2)로컬스토리지 3)session
                // 어디에 저장해야지 가장 안전한지는 말이 많다.
                // 우선 쿠키에다가 한다. ( 여러가지 방법이 있다, 각기 장단점이 있다. )
                res.cookie("x_auth" ,user.token)
                    .status(200)
                    .json({loginSuccess:true ,userId:user._id});
            });
        });
    });
});
// 미들웨어 auth 추가
// 미들웨어란? 경로를 받고 callback를 가기 전에 중간에서 진행되는 것
app.get('/api/users/auth',auth ,(req,res) =>{
    // 여기까지 왔으면 미들웨어가 통과되었다는 말
    res.status(200).json({
        _id: req.user._id,
        isAdmin : req.user.role === 0 ? false : true,
        isAuth : true,
        email : req.user.email,
        name : req.user.name,
        lastname : req.user.lastname,
        role : req.user.role,
        image : req.user.image,
    })
});

// 로그아웃 라우트 만들기

app.get('/api/users/logout' , auth , (req,res) => {
    // 로그아웃 할 때 DB 에서 해당 유저의 토큰을 지워준다.

    User.findOneAndUpdate({ _id : req.user._id },
        { token : ""}
    , (err, user) => {
        if(err) return  res.json({succes: false , err});
        return res.status(200).send({
            success: true,
        });
    });
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));

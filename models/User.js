const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10; // 솔트가 몇글자인지 나타내는 것 -> 솔트를 만들 때 10자리인 솔트를 만든다는 뜻 -> 10자리 비밀번호 암호화
// 솔트를 이용해서 비밀번호를 암호화 해야한다.
// 그렇기에 솔트를 먼저 생성
const jwt = require('jsonwebtoken');

const userSchema = mongoose.Schema({
    name : {
        type : String,
        maxLength : 50
    },
    email : {
        type : String,
        trim : true,
        unique : 1
    },
    password : {
        type : String,
        maxLength: 100
    },
    role : {
        type : Number,
        default : 0,
    },
    image : String,
    token : {
        type : String,
    },
    tokenExp : {
        type : Number
    }
});
//pre Mongo 메서드 , save 전에 함수 실행
userSchema.pre('save' , function(next){
    var user = this;
    if(user.isModified('password')){
        //비밀번호를 암호화 시킨다.
        bcrypt.genSalt(saltRounds,function(err,salt){
           if(err) return next(err);

           bcrypt.hash(user.password , salt , function (err,hash) {
              if(err) return next(err);
              user.password = hash;
              next();
           });
        });
    } else {
        next();
    }
});

userSchema.methods.comparePassword = function(plainPassword,cb) {

    //plainPassword 1234567 암호화된 비밀번호 $2b$10$l2Bu4G4FHJcK5rwUXoR8B.16IzeVMECUPHxFtRPWRmnWKAb4RLQdu
    //plainPassword 를 암호화해서 DB에 있는 비밀번호랑 같은지 확인해야한다.
    bcrypt.compare(plainPassword , this.password , function(err, isMatch){
       if(err) return cb(err);
        cb(null, isMatch)
    });

}
userSchema.methods.generateToken = function (cb) {

    var user = this;
    //jsonwebtoken을 이용해서 toekn을 생성하기
    let token = jwt.sign(user._id.toHexString() , 'secretToken');
    // user._id +'secretToken' = token
    // ->

    user.token = token;
    user.save(function(err,user){
       if(err) return cb(err);
       cb(null,user);
    });
}
const User = mongoose.model('User' , userSchema);
module.exports = { User };
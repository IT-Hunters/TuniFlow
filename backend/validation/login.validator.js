const isEmpty=require("./isEmpty")
const validator = require("validator")
module.exports=function validateLogin(data){
    let errors={};
   
    data.email= !isEmpty(data.email) ? data.email: "";
    data.password= !isEmpty(data.password) ? data.password: "";
    if(!validator.isEmail(data.email)){
        errors.email="required format email"
    }
    if(validator.isEmpty(data.email)){
        errors.email="required email"
    }
    if(validator.isEmpty(data.password)){
        errors.password="required password"
    }
  
    return{
        errors,
      isValid: isEmpty(errors),
    };
};
 
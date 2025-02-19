const isEmpty=require("./isEmpty")
const validator = require("validator")
module.exports=function validateRegister(data){
    let errors={};
    data.fullname= !isEmpty(data.fullname) ? data.fullname: "";
    data.lastname= !isEmpty(data.lastname) ? data.lastname: "";
    data.email= !isEmpty(data.email) ? data.email: "";
    data.password= !isEmpty(data.password) ? data.password: "";
    data.confirm= !isEmpty(data.confirm) ? data.confirm: "";
    if(validator.isEmpty(data.fullname)){
        errors.fullname="required fullname"
    }else if (data.fullname.length < 4) {
        errors.fullname = "Fullname must be at least 4 characters long";
    }
    if(validator.isEmpty(data.lastname)){
        errors.lastname="required lastname"
    }else if (data.lastname.length < 4) {
        errors.lastname = "lastname must be at least 4 characters long";
    }
    if(!validator.isEmail(data.email)){
        errors.email="required format email"
    }
    if(validator.isEmpty(data.email)){
        errors.email="required email"
    }
    if(validator.isEmpty(data.password)){
        errors.password="required password"
    }else if (data.password.length < 6) {
        errors.password = "Password must be at least 6 characters long";
    } else if ((data.password.match(/\d/g) || []).length < 2) {
        errors.password = "Password must contain at least 2 numbers";
    }
    if(!validator.equals(data.password, data.confirm)){
        errors.confirm= "password not matches";

    }
    if(validator.isEmpty(data.confirm)){
        errors.confirm="required confirm"
    }
    return{
        errors,
      isValid: isEmpty(errors),
    };
};
 
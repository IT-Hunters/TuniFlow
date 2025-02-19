const multer= require("multer");
const path= require("path");
const storage=multer.diskStorage({
    destination: "public/images/",
    filename: function(req, file, cb){
        const uniqueSuffix =
        Date.now()+
        "-"+
        Math.round(Math.random() * 1e9)+
        path.extname(file.originalname);
        cb(null, file.fieldname+ "-" + uniqueSuffix);
    },
})

const filter=(file, cb)=> {
    const fileType = /png|jpg|jpeg/;
    const extname = fileType.test(path.extname(file.originalname));
    if(extname){
        cb(null, true);
    }else{
        return cb(new Error("invalid mime type"))
    }
};
const multerImage=multer({
    storage:storage,
    limits: {
        fileSize: 1000000,
    },
    fileFilter: function(req, file, cb){
        filter(file,cb);
    },
});
module.exports = multerImage;
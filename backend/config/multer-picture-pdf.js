const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination: "public/images/",
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
        cb(null, file.fieldname + "-" + uniqueSuffix);
    },
});

const filter = (file, cb) => {
    const allowedExtensions = /png|jpg|jpeg|pdf|jfif/;
    const ext = path.extname(file.originalname).toLowerCase();
    const extname = allowedExtensions.test(ext);
    
    // Accepter si l'extension est autorisée
    if (extname) {
        return cb(null, true);
    } else {
        console.error(`Invalid file: ${file.originalname} with mime type: ${file.mimetype}`);
        return cb(new Error("Invalid mime type"));
    }
};


const multerImage = multer({
    storage: storage,
    limits: {
          fileSize: 5 * 1024 * 1024, // Limite de taille du fichier (1MB)
    },
    fileFilter: function(req, file, cb) {
        filter(file, cb);
    },
});

module.exports = multerImage;
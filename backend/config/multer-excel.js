const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination: "public/uploads/", // Dossier pour les fichiers Excel
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
        cb(null, file.fieldname + "-" + uniqueSuffix);
    },
});

const filter = (file, cb) => {
    const fileType = /xlsx|xls/; // Accepter seulement les fichiers Excel
    const extname = fileType.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
        cb(null, true);
    } else {
        return cb(new Error("Invalid file type. Only Excel files are allowed."));
    }
};

const multerExcel = multer({
    storage: storage,
    limits: {
        fileSize: 5000000, // Limite de taille : 5MB
    },
    fileFilter: function(req, file, cb) {
        filter(file, cb);
    },
});

module.exports = multerExcel;

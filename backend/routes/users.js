var express = require('express');
var router = express.Router();
const { Register,Login,getAll,findMyProfile,deleteprofilbyid,deletemyprofile,acceptAutorisation
  ,updateProfile,AddPicture,getAllBusinessManagers,getAllAccountants,getAllFinancialManagers,
  getAllRH,findMyProject,Registerwithproject,resetPassword,forgotPassword,verifyCode,sendVerificationCode,getAllempl,addEmployeesFromExcel,
  getAllBusinessOwners,addEmployee,downloadEvidence,RegisterManger,getAllRoles,findMyPicture,logout} = require('../controllers/auth');
  const multerImage = require("../config/multer-picture");
  const multerImageAndPdf = require("../config/multer-picture-pdf");
  const multerExcel = require("../config/multer-excel");
const { authenticateJWT } = require('../config/autorisation');
/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});
router.get("/findmypicture",authenticateJWT, findMyPicture);
router.post('/upload-employees', multerExcel.single('file'), addEmployeesFromExcel);
router.post('/addemployee', addEmployee)
router.post("/register", multerImageAndPdf.single("evidence"), Register);
router.post("/login",Login)
router.post("/logout",authenticateJWT,logout)
router.get("/getall",authenticateJWT,getAll)
router.get("/findMyProfile",authenticateJWT,findMyProfile)
router.delete("/deletebyid",deleteprofilbyid)
router.delete("/deletemyprofil",authenticateJWT,deletemyprofile)
router.put("/acceptAutorisation/:id", acceptAutorisation);
router.put("/updateprofile", authenticateJWT, updateProfile);
router.put("/uploadimage",authenticateJWT,AddPicture)
router.get("/getAllBusinessManagers",authenticateJWT,getAllBusinessManagers)
router.get("/getAllBusinessOwners",authenticateJWT,getAllBusinessOwners)
router.get("/getAllAccountants",authenticateJWT,getAllAccountants)
router.get("/getAllFinancialManagers",authenticateJWT,getAllFinancialManagers)
router.get("/getAllRH",authenticateJWT,getAllRH)
router.get('/findMyProject', authenticateJWT, findMyProject);router.post("/send-code", sendVerificationCode);
router.post("/forgot-password",forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/verify-code", verifyCode);
router.get('/download/:fileName', downloadEvidence);
router.get("/roles", getAllRoles);
/*router.post("/registerwithproject/:projectId", async (req, res) => {
  const { projectId } = req.params;
  await Registerwithproject(req, res, projectId);
});*/
router.post('/registerwithproject',authenticateJWT,Registerwithproject);
router.post('/registermanager',authenticateJWT,RegisterManger);
module.exports = router;

var express = require('express');
var router = express.Router();
const { Register,Login,getAll,findMyProfile,deleteprofilbyid,deletemyprofile,acceptAutorisation
  ,updateProfile,AddPicture,getAllBusinessManagers,getAllAccountants,getAllFinancialManagers,
  getAllRH,findMyProject,Registerwithproject
  } = require('../controllers/auth');
const { authenticateJWT } = require('../config/autorisation');
/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});
router.post("/register",Register)
router.post("/login",Login)
router.get("/getall",authenticateJWT,getAll)
router.get("/findMyProfile",authenticateJWT,findMyProfile)
router.delete("/deletebyid",deleteprofilbyid)
router.delete("/deletemyprofil",authenticateJWT,deletemyprofile)
router.put("/acceptAutorisation/:id", acceptAutorisation);
router.put("/updateprofile", authenticateJWT, updateProfile);
router.put("/uploadimage",authenticateJWT,AddPicture)
router.get("/getAllBusinessManagers",authenticateJWT,getAllBusinessManagers)
router.get("/getAllAccountants",authenticateJWT,getAllAccountants)
router.get("/getAllFinancialManagers",authenticateJWT,getAllFinancialManagers)
router.get("/getAllRH",authenticateJWT,getAllRH)
router.get('/findMyProject', authenticateJWT, findMyProject);
router.post("/registerwithproject/:projectId", async (req, res) => {
  const { projectId } = req.params;
  await Registerwithproject(req, res, projectId);
});
module.exports = router;

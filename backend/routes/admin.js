const express = require("express");
const router = express.Router();
const controller = require("../controllers/adminController");


router.post("/login", controller.adminLogin);
router.get("/users", controller.getAllUsers);
// Officials management
router.get('/officials', controller.getOfficials);
router.post('/officials', controller.addOfficial);
router.delete('/officials/:id', controller.deleteOfficial);


module.exports = router;
const router = require("express").Router();
const verifyToken = require("../middleware/authMiddleware");
const checkRole = require("../middleware/roleMiddleware");
const {
  getAllFlights,
  updateFlightStatus,
} = require("../controllers/trafficController");

router.get("/flights", verifyToken, getAllFlights);
router.patch(
  "/status/:id",
  verifyToken,
  checkRole(["controller"]),
  updateFlightStatus,
);

module.exports = router;

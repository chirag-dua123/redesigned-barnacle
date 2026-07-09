const router = require("express").Router();
const verifyToken = require("../middleware/authMiddleware");
const checkRole = require("../middleware/roleMiddleware");
const {
  getGateMatrix,
  assignGateToFlight,
  logRefueling,
} = require("../controllers/groundController");

router.get("/gates", verifyToken, getGateMatrix);
router.post(
  "/assign-gate",
  verifyToken,
  checkRole(["controller", "ground_staff"]),
  assignGateToFlight,
);
router.post(
  "/refuel",
  verifyToken,
  checkRole(["ground_staff"]),
  logRefueling,
);

module.exports = router;

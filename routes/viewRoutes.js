const router = require("express").Router();
const verifyToken = require("../middleware/authMiddleware");

router.get("/", (req, res) => {
  res.render("login", {
    pageTitle: "Login",
    user: null,
    pageScript: "login",
    showRegister: false,
  });
});

router.get("/login", (req, res) => {
  res.render("login", {
    pageTitle: "Login",
    user: null,
    pageScript: "login",
    showRegister: false,
  });
});

router.get("/register", (req, res) => {
  res.render("login", {
    pageTitle: "Register",
    user: null,
    pageScript: "login",
    showRegister: true,
  });
});

router.get("/dashboard", verifyToken, (req, res) => {
  if (req.user.role === "controller") {
    return res.render("dashboard-atc", {
      pageTitle: "ATC Dashboard",
      user: req.user,
      pageScript: "dashboard-atc",
    });
  }

  return res.render("dashboard-ground", {
    pageTitle: "Ground Dashboard",
    user: req.user,
    pageScript: "dashboard-ground",
  });
});

router.get("/dashboard/atc", verifyToken, (req, res) => {
  if (req.user.role !== "controller") {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  return res.render("dashboard-atc", {
    pageTitle: "ATC Dashboard",
    user: req.user,
    pageScript: "dashboard-atc",
  });
});

router.get("/dashboard/ground", verifyToken, (req, res) => {
  if (req.user.role !== "ground_staff") {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  return res.render("dashboard-ground", {
    pageTitle: "Ground Dashboard",
    user: req.user,
    pageScript: "dashboard-ground",
  });
});

module.exports = router;

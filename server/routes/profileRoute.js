const router = require("express").Router();
const protect = require("../middleware/authMiddleware");
const multer = require("multer");
const {
  getProfile,
  setMaxes,
  getUserProfile,
  updateProfile,
  updateAvatar,
} = require("../controllers/profileController");

// Configure multer for avatar uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

router.get("/profile", protect, getProfile);
router.get("/profile/:userId", protect, getUserProfile);
router.post("/maxes", protect, setMaxes);
router.put("/profile/update", protect, updateProfile); // JSON body
router.post("/profile/avatar", protect, upload.single("avatar"), updateAvatar); // FormData with file

module.exports = router;

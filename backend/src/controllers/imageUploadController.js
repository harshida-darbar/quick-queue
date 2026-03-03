// quick-queue/backend/src/controllers/imageUploadController.js

const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure storage for service images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/services";
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "service-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  // Check if mimetype starts with 'image/'
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"));
  }
};

// Multer upload configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
});

// Middleware wrapper for single image upload with error handling
exports.uploadSingleMiddleware = (req, res, next) => {
  const uploadSingle = upload.single("image");
  uploadSingle(req, res, (err) => {
    if (err) {
      console.error("Multer single upload error:", err);
      return res.status(400).json({ 
        message: err.message || "Error uploading image",
        error: err.toString()
      });
    }
    next();
  });
};

// Middleware wrapper for multiple images upload with error handling
exports.uploadMultipleMiddleware = (req, res, next) => {
  const uploadMultiple = upload.array("images", 5);
  uploadMultiple(req, res, (err) => {
    if (err) {
      console.error("Multer multiple upload error:", err);
      return res.status(400).json({ 
        message: err.message || "Error uploading images",
        error: err.toString()
      });
    }
    next();
  });
};

// Handle single image upload
exports.handleSingleUpload = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const imageUrl = `/api/services/image/${req.file.filename}`;
    res.json({
      message: "Image uploaded successfully",
      imageUrl: imageUrl,
      filename: req.file.filename,
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({ message: "Failed to upload image", error: error.message });
  }
};

// Handle multiple images upload
exports.handleMultipleUpload = (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const imageUrls = req.files.map(
      (file) => `/api/services/image/${file.filename}`
    );
    const filenames = req.files.map((file) => file.filename);

    res.json({
      message: "Images uploaded successfully",
      imageUrls: imageUrls,
      filenames: filenames,
      count: req.files.length,
    });
  } catch (error) {
    console.error("Error uploading images:", error);
    res.status(500).json({ message: "Failed to upload images", error: error.message });
  }
};

// Serve service image
exports.getServiceImage = (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(__dirname, "../../uploads/services", filename);

    if (fs.existsSync(filepath)) {
      res.sendFile(filepath);
    } else {
      res.status(404).json({ message: "Image not found" });
    }
  } catch (error) {
    console.error("Error serving image:", error);
    res.status(500).json({ message: "Failed to serve image" });
  }
};

// Delete service image
exports.deleteServiceImage = (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(__dirname, "../../uploads/services", filename);

    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      res.json({ message: "Image deleted successfully" });
    } else {
      res.status(404).json({ message: "Image not found" });
    }
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({ message: "Failed to delete image" });
  }
};

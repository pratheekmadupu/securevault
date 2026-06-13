const express = require('express');
const router = express.Router();
const multer = require('multer');
const fileController = require('../controllers/fileController');
const authMiddleware = require('../middleware/auth');

// Multer setup to store files in-memory before uploading to Firebase/Local simulated Storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB maximum file size validation
  }
});

// --- OPERATOR PROTECTED ROUTES ---

// List all files owned by operator
router.get('/', authMiddleware, fileController.listFiles);

// Upload E2EE encrypted file
router.post('/upload', authMiddleware, upload.single('file'), fileController.uploadFile);

// Decrypt and download file owned by operator
router.get('/download/:fileId', authMiddleware, fileController.downloadFile);

// Rename document in ledger
router.put('/rename/:fileId', authMiddleware, fileController.renameFile);

// Delete/Shred document from storage
router.delete('/:fileId', authMiddleware, fileController.deleteFile);

// Generate secure share pipeline
router.post('/share', authMiddleware, fileController.shareFile);

// Revoke access share pipeline
router.delete('/share/revoke/:shareId', authMiddleware, fileController.revokeShare);


// --- PUBLIC UNRESTRICTED ROUTES ---

// Download/Preview Shared File (checked against expiration and token validity)
router.get('/shared/:shareId', fileController.getSharedFile);

module.exports = router;

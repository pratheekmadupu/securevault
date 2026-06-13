const crypto = require('crypto');
const { 
  getFiles, getFile, saveFileMetadata, updateFileMetadata, 
  deleteFileMetadata, uploadFileToStorage, downloadFileFromStorage, 
  deleteFileFromStorage, addAuditLog, getFileByShareId 
} = require('../config/firebase');

// Format bytes
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Retrieve files list for current user.
 */
const listFiles = async (req, res) => {
  try {
    const userId = req.user.uid;
    const files = await getFiles(userId);
    res.status(200).json(files);
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ message: 'Failed to retrieve file catalogue.' });
  }
};

/**
 * Upload E2EE File.
 */
const uploadFile = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { name, type, size, encryptionKey } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'No file attachment detected.' });
    }

    if (!name || !type || !size || !encryptionKey) {
      return res.status(400).json({ message: 'Incomplete file metadata payload.' });
    }

    // Generate unique file ID
    const fileId = 'file_' + crypto.randomBytes(8).toString('hex');
    const storagePath = `uploads/${userId}/${fileId}.enc`;

    // Save encrypted file buffer to Storage
    await uploadFileToStorage(req.file.buffer, storagePath);

    // Save metadata
    const metadata = {
      name,
      type,
      size: parseInt(size),
      ownerId: userId,
      storagePath,
      encryptionKey,
      createdAt: new Date().toISOString(),
      sharing: {
        active: false,
        shareId: '',
        expiresAt: '',
        createdAt: ''
      }
    };

    const record = await saveFileMetadata(fileId, metadata);

    // Log the transaction
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    await addAuditLog({
      userId,
      action: 'FILE_UPLOAD',
      details: `Uploaded encrypted document: "${name}" (${formatBytes(size)})`,
      status: 'SUCCESS',
      ipAddress,
      userAgent: req.headers['user-agent'] || 'Unknown'
    });

    res.status(201).json({ message: 'Encrypted document uploaded successfully.', record });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ message: 'Failed to upload document.' });
  }
};

/**
 * Decrypt & Download File.
 */
const downloadFile = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { fileId } = req.params;

    const fileMeta = await getFile(fileId);
    
    if (!fileMeta) {
      return res.status(404).json({ message: 'Requested document not found.' });
    }

    // IDOR protection: Verify ownership
    if (fileMeta.ownerId !== userId) {
      // Log unauthorized access attempt
      const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
      await addAuditLog({
        userId: fileMeta.ownerId, // notify owner of breach
        action: 'FILE_ACCESS_BREACH',
        details: `Unauthorized file access attempted on "${fileMeta.name}" by user UID ${userId}`,
        status: 'FAILED',
        ipAddress,
        userAgent: req.headers['user-agent'] || 'Unknown'
      });
      return res.status(403).json({ message: 'Forbidden. You do not hold access clearance for this resource.' });
    }

    // Retrieve encrypted file ciphertext
    const ciphertext = await downloadFileFromStorage(fileMeta.storagePath);

    // Log the successful decryption/download
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    await addAuditLog({
      userId,
      action: 'FILE_DECRYPT_DOWNLOAD',
      details: `Downloaded and decrypted document: "${fileMeta.name}"`,
      status: 'SUCCESS',
      ipAddress,
      userAgent: req.headers['user-agent'] || 'Unknown'
    });

    res.status(200).json({
      ciphertext,
      name: fileMeta.name,
      type: fileMeta.type,
      encryptionKey: fileMeta.encryptionKey
    });

  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ message: 'Failed to download encrypted resource.' });
  }
};

/**
 * Rename File.
 */
const renameFile = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { fileId } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name parameter is required.' });
    }

    const fileMeta = await getFile(fileId);

    if (!fileMeta) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    if (fileMeta.ownerId !== userId) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const oldName = fileMeta.name;
    await updateFileMetadata(fileId, { name });

    // Log renaming
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    await addAuditLog({
      userId,
      action: 'FILE_RENAME',
      details: `Renamed file from "${oldName}" to "${name}"`,
      status: 'SUCCESS',
      ipAddress,
      userAgent: req.headers['user-agent'] || 'Unknown'
    });

    res.status(200).json({ message: 'File renamed successfully.' });
  } catch (error) {
    console.error('Error renaming file:', error);
    res.status(500).json({ message: 'Failed to rename document.' });
  }
};

/**
 * Shred/Delete File.
 */
const deleteFile = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { fileId } = req.params;

    const fileMeta = await getFile(fileId);

    if (!fileMeta) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    if (fileMeta.ownerId !== userId) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    // Delete ciphertext from storage bucket
    await deleteFileFromStorage(fileMeta.storagePath);

    // Delete metadata
    await deleteFileMetadata(fileId);

    // Log deletion
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    await addAuditLog({
      userId,
      action: 'FILE_DELETE',
      details: `Shredded document from archive: "${fileMeta.name}"`,
      status: 'SUCCESS',
      ipAddress,
      userAgent: req.headers['user-agent'] || 'Unknown'
    });

    res.status(200).json({ message: 'Document deleted securely.' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ message: 'Failed to shred file.' });
  }
};

/**
 * Generate Secure Shared Portal Link.
 */
const shareFile = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { fileId, expiresAt } = req.body;

    if (!fileId || !expiresAt) {
      return res.status(400).json({ message: 'File ID and expiration timestamp required.' });
    }

    const fileMeta = await getFile(fileId);

    if (!fileMeta) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    if (fileMeta.ownerId !== userId) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const shareId = 'share_' + crypto.randomBytes(12).toString('hex');
    const sharingConfig = {
      active: true,
      shareId,
      expiresAt,
      createdAt: new Date().toISOString()
    };

    await updateFileMetadata(fileId, { sharing: sharingConfig });

    // Log share generation
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    await addAuditLog({
      userId,
      action: 'FILE_SHARE_GENERATE',
      details: `Created secure sharing pipeline for "${fileMeta.name}" expiring at: ${new Date(expiresAt).toLocaleString()}`,
      status: 'SUCCESS',
      ipAddress,
      userAgent: req.headers['user-agent'] || 'Unknown'
    });

    res.status(200).json({ 
      message: 'Access link provisioned.', 
      shareUrl: `/shared-view/${shareId}` 
    });
  } catch (error) {
    console.error('Error sharing file:', error);
    res.status(500).json({ message: 'Failed to create share pipeline.' });
  }
};

/**
 * Revoke Shared Link.
 */
const revokeShare = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { shareId } = req.params;

    const files = await getFiles(userId);
    const fileToRevoke = files.find(f => f.sharing && f.sharing.shareId === shareId);

    if (!fileToRevoke) {
      return res.status(404).json({ message: 'Active shared pipeline not found.' });
    }

    const revokedSharingConfig = {
      active: false,
      shareId: '',
      expiresAt: '',
      createdAt: ''
    };

    await updateFileMetadata(fileToRevoke.id, { sharing: revokedSharingConfig });

    // Log revocation
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    await addAuditLog({
      userId,
      action: 'FILE_SHARE_REVOKE',
      details: `Revoked access pipeline for document "${fileToRevoke.name}"`,
      status: 'SUCCESS',
      ipAddress,
      userAgent: req.headers['user-agent'] || 'Unknown'
    });

    res.status(200).json({ message: 'Access pipeline revoked successfully.' });
  } catch (error) {
    console.error('Error revoking share:', error);
    res.status(500).json({ message: 'Failed to revoke shared pipeline.' });
  }
};

/**
 * Get Shared File (Public Endpoint).
 */
const getSharedFile = async (req, res) => {
  try {
    const { shareId } = req.params;

    const fileMeta = await getFileByShareId(shareId);

    if (!fileMeta) {
      return res.status(403).json({ message: 'Access denied. Active share link not found or revoked.' });
    }

    // Check expiration duration
    const isExpired = new Date(fileMeta.sharing.expiresAt) < new Date();
    if (isExpired) {
      // Deactivate expired share
      await updateFileMetadata(fileMeta.id, {
        sharing: { active: false, shareId: '', expiresAt: '', createdAt: '' }
      });

      // Log expired access attempt
      const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
      await addAuditLog({
        userId: fileMeta.ownerId,
        action: 'FILE_SHARE_EXPIRED_ACCESS',
        details: `Access attempt blocked on expired link for document: "${fileMeta.name}"`,
        status: 'FAILED',
        ipAddress,
        userAgent: req.headers['user-agent'] || 'Unknown'
      });

      return res.status(403).json({ message: 'Access denied. Shared link duration has expired.' });
    }

    // Retrieve encrypted ciphertext
    const ciphertext = await downloadFileFromStorage(fileMeta.storagePath);

    // Log successful public access event to owner's history
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    await addAuditLog({
      userId: fileMeta.ownerId,
      action: 'FILE_SHARE_ACCESS',
      details: `Shared access tunnel read: downloaded encrypted payload for "${fileMeta.name}"`,
      status: 'SUCCESS',
      ipAddress,
      userAgent: req.headers['user-agent'] || 'Unknown'
    });

    res.status(200).json({
      ciphertext,
      name: fileMeta.name,
      type: fileMeta.type,
      encryptionKey: fileMeta.encryptionKey,
      expiresAt: fileMeta.sharing.expiresAt
    });

  } catch (error) {
    console.error('Error in public download endpoint:', error);
    res.status(500).json({ message: 'Insecure direct request failed.' });
  }
};

module.exports = {
  listFiles,
  uploadFile,
  downloadFile,
  renameFile,
  deleteFile,
  shareFile,
  revokeShare,
  getSharedFile
};

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const isFirebaseConfigured = !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
let db = null;
let bucket = null;

// Paths for simulated local JSON database and storage
const DB_FILES_PATH = path.join(__dirname, '..', '..', 'db_files.json');
const DB_LOGS_PATH = path.join(__dirname, '..', '..', 'db_logs.json');
const STORAGE_DIR = path.join(__dirname, '..', '..', 'storage');

// Create local directories/files if they don't exist
if (!isFirebaseConfigured) {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILES_PATH)) {
    fs.writeFileSync(DB_FILES_PATH, JSON.stringify([]));
  }
  if (!fs.existsSync(DB_LOGS_PATH)) {
    fs.writeFileSync(DB_LOGS_PATH, JSON.stringify([]));
  }
  console.log('🛡️ SecureVault Backend: No Firebase credentials. local JSON DB and storage initiated.');
} else {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${serviceAccount.project_id}.appspot.com`
    });
    db = admin.firestore();
    bucket = admin.storage().bucket();
    console.log('🔒 SecureVault Backend: Connected to Firebase Admin SDK.');
  } catch (error) {
    console.error('❌ SecureVault Backend: Failed to initialize Firebase Admin. Falling back to local simulation.', error);
  }
}

// ----------------------------------------------------
// DATABASE SERVICE ABSTRACTION
// ----------------------------------------------------

/**
 * Fetch all files for a user.
 */
const getFiles = async (userId) => {
  if (db) {
    const snapshot = await db.collection('files').where('ownerId', '==', userId).get();
    const list = [];
    snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
    return list;
  } else {
    const data = fs.readFileSync(DB_FILES_PATH, 'utf8');
    const allFiles = JSON.parse(data || '[]');
    return allFiles.filter(file => file.ownerId === userId);
  }
};

/**
 * Fetch a single file metadata by ID.
 */
const getFile = async (fileId) => {
  if (db) {
    const doc = await db.collection('files').doc(fileId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  } else {
    const data = fs.readFileSync(DB_FILES_PATH, 'utf8');
    const allFiles = JSON.parse(data || '[]');
    return allFiles.find(file => file.id === fileId) || null;
  }
};

/**
 * Save new file metadata.
 */
const saveFileMetadata = async (fileId, metadata) => {
  if (db) {
    await db.collection('files').doc(fileId).set(metadata);
    return { id: fileId, ...metadata };
  } else {
    const data = fs.readFileSync(DB_FILES_PATH, 'utf8');
    const allFiles = JSON.parse(data || '[]');
    const newRecord = { id: fileId, ...metadata };
    allFiles.push(newRecord);
    fs.writeFileSync(DB_FILES_PATH, JSON.stringify(allFiles, null, 2));
    return newRecord;
  }
};

/**
 * Update file metadata.
 */
const updateFileMetadata = async (fileId, updateData) => {
  if (db) {
    await db.collection('files').doc(fileId).update(updateData);
    return true;
  } else {
    const data = fs.readFileSync(DB_FILES_PATH, 'utf8');
    const allFiles = JSON.parse(data || '[]');
    const index = allFiles.findIndex(file => file.id === fileId);
    if (index === -1) return false;
    allFiles[index] = { ...allFiles[index], ...updateData };
    fs.writeFileSync(DB_FILES_PATH, JSON.stringify(allFiles, null, 2));
    return true;
  }
};

/**
 * Delete file metadata.
 */
const deleteFileMetadata = async (fileId) => {
  if (db) {
    await db.collection('files').doc(fileId).delete();
    return true;
  } else {
    const data = fs.readFileSync(DB_FILES_PATH, 'utf8');
    const allFiles = JSON.parse(data || '[]');
    const filtered = allFiles.filter(file => file.id !== fileId);
    fs.writeFileSync(DB_FILES_PATH, JSON.stringify(filtered, null, 2));
    return true;
  }
};

/**
 * Find file metadata by active share ID.
 */
const getFileByShareId = async (shareId) => {
  if (db) {
    const snapshot = await db.collection('files')
      .where('sharing.shareId', '==', shareId)
      .where('sharing.active', '==', true)
      .get();
    if (snapshot.empty) return null;
    let found = null;
    snapshot.forEach(doc => { found = { id: doc.id, ...doc.data() }; });
    return found;
  } else {
    const data = fs.readFileSync(DB_FILES_PATH, 'utf8');
    const allFiles = JSON.parse(data || '[]');
    return allFiles.find(file => file.sharing && file.sharing.shareId === shareId && file.sharing.active === true) || null;
  }
};

// ----------------------------------------------------
// STORAGE SERVICE ABSTRACTION
// ----------------------------------------------------

/**
 * Upload encrypted payload to storage.
 */
const uploadFileToStorage = async (fileBuffer, storagePath) => {
  if (bucket) {
    const file = bucket.file(storagePath);
    await file.save(fileBuffer);
    return true;
  } else {
    const localPath = path.join(STORAGE_DIR, storagePath);
    const parentDir = path.dirname(localPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(localPath, fileBuffer);
    return true;
  }
};

/**
 * Download encrypted payload from storage.
 * Returns file content as a string.
 */
const downloadFileFromStorage = async (storagePath) => {
  if (bucket) {
    const file = bucket.file(storagePath);
    const [content] = await file.download();
    return content.toString('utf8');
  } else {
    const localPath = path.join(STORAGE_DIR, storagePath);
    if (!fs.existsSync(localPath)) {
      throw new Error('Storage file not found: ' + storagePath);
    }
    return fs.readFileSync(localPath, 'utf8');
  }
};

/**
 * Delete encrypted payload from storage.
 */
const deleteFileFromStorage = async (storagePath) => {
  if (bucket) {
    const file = bucket.file(storagePath);
    await file.delete().catch(() => {}); // ignore error if file missing
    return true;
  } else {
    const localPath = path.join(STORAGE_DIR, storagePath);
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }
    return true;
  }
};

// ----------------------------------------------------
// AUDIT LOGS SERVICE ABSTRACTION
// ----------------------------------------------------

/**
 * Append audit log entry.
 */
const addAuditLog = async (logEntry) => {
  const newLog = {
    id: 'log_' + Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toISOString(),
    ...logEntry
  };

  if (db) {
    await db.collection('logs').doc(newLog.id).set(newLog);
    return newLog;
  } else {
    const data = fs.readFileSync(DB_LOGS_PATH, 'utf8');
    const allLogs = JSON.parse(data || '[]');
    allLogs.push(newLog);
    fs.writeFileSync(DB_LOGS_PATH, JSON.stringify(allLogs, null, 2));
    return newLog;
  }
};

/**
 * Retrieve all audit logs for a user.
 */
const getAuditLogs = async (userId) => {
  if (db) {
    const snapshot = await db.collection('logs')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .get();
    const list = [];
    snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
    return list;
  } else {
    const data = fs.readFileSync(DB_LOGS_PATH, 'utf8');
    const allLogs = JSON.parse(data || '[]');
    return allLogs
      .filter(log => log.userId === userId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }
};

module.exports = {
  isFirebaseConfigured,
  admin,
  getFiles,
  getFile,
  saveFileMetadata,
  updateFileMetadata,
  deleteFileMetadata,
  getFileByShareId,
  uploadFileToStorage,
  downloadFileFromStorage,
  deleteFileFromStorage,
  addAuditLog,
  getAuditLogs
};

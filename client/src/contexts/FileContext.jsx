import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { encryptFile, decryptFile, downloadDecryptedFile, generateEncryptionKey } from '../services/crypto';
import { useAuth } from './AuthContext';

const FileContext = createContext();

export const useFiles = () => useContext(FileContext);

export const FileProvider = ({ children }) => {
  const { user, refreshLogs } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fetchFiles = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await api.files.list();
      setFiles(data);
    } catch (err) {
      console.error('Failed to fetch files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchFiles();
    } else {
      setFiles([]);
    }
  }, [user]);

  // Upload file
  const upload = async (file, onProgressCallback) => {
    if (!user) throw new Error('Authentication required.');

    setUploadProgress(10);
    if (onProgressCallback) onProgressCallback(10);

    try {
      // 1. Generate AES-256 Key
      const aesKey = generateEncryptionKey();

      // 2. Encrypt File Client-Side
      // Progress map: 10% to 50%
      const encryptedBlob = await encryptFile(file, aesKey, (cryptoPercent) => {
        const mappedPercent = Math.round(cryptoPercent * 0.4) + 10;
        setUploadProgress(mappedPercent);
        if (onProgressCallback) onProgressCallback(mappedPercent);
      });

      // 3. Prepare Metadata
      const fileMetadata = {
        name: file.name,
        type: file.type,
        size: file.size,
        encryptionKey: aesKey
      };

      setUploadProgress(60);
      if (onProgressCallback) onProgressCallback(60);

      // 4. Upload Ciphertext to Backend
      await api.files.upload(encryptedBlob, fileMetadata);

      setUploadProgress(100);
      if (onProgressCallback) onProgressCallback(100);

      // Refresh file list & audit logs
      await fetchFiles();
      await refreshLogs();
    } catch (err) {
      setUploadProgress(0);
      if (onProgressCallback) onProgressCallback(0);
      throw err;
    } finally {
      // Reset upload progress after 2 seconds
      setTimeout(() => setUploadProgress(0), 2000);
    }
  };

  // Download & Decrypt File
  const download = async (fileId) => {
    if (!user) throw new Error('Authentication required.');
    
    setLoading(true);
    try {
      // 1. Fetch file payload (ciphertext, name, type, and AES key)
      const data = await api.files.download(fileId);
      
      // 2. Decrypt Ciphertext Client-Side
      const decryptedDataUrl = decryptFile(data.ciphertext, data.encryptionKey);
      
      // 3. Trigger Browser Download
      downloadDecryptedFile(decryptedDataUrl, data.name);
      
      // Refresh audit logs
      await refreshLogs();
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Preview Document (returns Decrypted Data URL)
  const preview = async (fileId) => {
    if (!user) throw new Error('Authentication required.');
    try {
      const data = await api.files.download(fileId);
      const decryptedDataUrl = decryptFile(data.ciphertext, data.encryptionKey);
      return {
        dataUrl: decryptedDataUrl,
        name: data.name,
        type: data.type
      };
    } catch (err) {
      throw err;
    }
  };

  // Rename File
  const rename = async (fileId, newName) => {
    if (!user) throw new Error('Authentication required.');
    try {
      await api.files.rename(fileId, newName);
      await fetchFiles();
      await refreshLogs();
    } catch (err) {
      throw err;
    }
  };

  // Delete File
  const remove = async (fileId) => {
    if (!user) throw new Error('Authentication required.');
    try {
      await api.files.delete(fileId);
      await fetchFiles();
      await refreshLogs();
    } catch (err) {
      throw err;
    }
  };

  // Share File
  const share = async (fileId, expiresAt) => {
    if (!user) throw new Error('Authentication required.');
    try {
      const response = await api.sharing.createLink(fileId, expiresAt);
      await fetchFiles(); // refresh sharing permissions in file list
      await refreshLogs();
      return response.shareUrl; // Return the share url path (e.g. /shared/:shareId)
    } catch (err) {
      throw err;
    }
  };

  // Revoke Share Link
  const revokeShare = async (shareId) => {
    if (!user) throw new Error('Authentication required.');
    try {
      await api.sharing.revokeLink(shareId);
      await fetchFiles();
      await refreshLogs();
    } catch (err) {
      throw err;
    }
  };

  const value = {
    files,
    loading,
    uploadProgress,
    upload,
    download,
    preview,
    rename,
    deleteFile: remove,
    share,
    revokeShare,
    refreshFiles: fetchFiles
  };

  return <FileContext.Provider value={value}>{children}</FileContext.Provider>;
};

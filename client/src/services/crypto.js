import CryptoJS from 'crypto-js';

/**
 * Generates a random 256-bit key for AES-256 encryption.
 * @returns {string} Hexadecimal string representing the key.
 */
export const generateEncryptionKey = () => {
  return CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex);
};

/**
 * Encricts a File object using AES-256.
 * @param {File} file - The file to encrypt.
 * @param {string} key - The encryption key (hex format).
 * @param {function} onProgress - Progress callback (0 to 100).
 * @returns {Promise<Blob>} A promise resolving to the encrypted blob.
 */
export const encryptFile = (file, key, onProgress) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadstart = () => {
      if (onProgress) onProgress(10);
    };

    reader.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        // Map reading progress to 10-50%
        const percent = Math.round((e.loaded / e.total) * 40) + 10;
        onProgress(percent);
      }
    };

    reader.onload = () => {
      try {
        if (onProgress) onProgress(60);
        
        const fileData = reader.result; // Data URL containing base64 string
        
        // Encrypt the entire Data URL string using AES-256
        const encrypted = CryptoJS.AES.encrypt(fileData, key).toString();
        
        if (onProgress) onProgress(90);
        
        // Return ciphertext as a text blob
        const blob = new Blob([encrypted], { type: 'text/plain' });
        
        if (onProgress) onProgress(100);
        resolve(blob);
      } catch (err) {
        reject(new Error('Encryption failed: ' + err.message));
      }
    };

    reader.onerror = () => {
      reject(new Error('File reading failed.'));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Decrypts ciphertext back into the original file content.
 * @param {string} ciphertext - The encrypted text data.
 * @param {string} key - The encryption key.
 * @returns {string} The original file Data URL (can be used to download/preview).
 */
export const decryptFile = (ciphertext, key) => {
  try {
    const decryptedBytes = CryptoJS.AES.decrypt(ciphertext, key);
    const decryptedData = decryptedBytes.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedData || !decryptedData.startsWith('data:')) {
      throw new Error('Invalid key or corrupted data.');
    }
    
    return decryptedData;
  } catch (err) {
    throw new Error('Decryption failed. Please verify the integrity of the key.');
  }
};

/**
 * Converts a data URL to a downloadable file.
 * @param {string} dataUrl - The data URL of the file.
 * @param {string} filename - The name to save the file as.
 */
export const downloadDecryptedFile = (dataUrl, filename) => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

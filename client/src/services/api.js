const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Helper to fetch headers with the auth token.
 */
const getHeaders = (isMultipart = false) => {
  const token = localStorage.getItem('sv_token');
  const headers = {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  
  return headers;
};

/**
 * Handle fetch response.
 */
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.message || `HTTP error! status: ${response.status}`;
    throw new Error(errorMessage);
  }
  return response.json();
};

export const api = {
  // Authentication Sync
  auth: {
    syncUser: async (userData) => {
      const response = await fetch(`${API_BASE_URL}/auth/sync`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(userData),
      });
      return handleResponse(response);
    },
    
    getLogs: async () => {
      const response = await fetch(`${API_BASE_URL}/auth/logs`, {
        method: 'GET',
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
  },

  // File Operations
  files: {
    list: async () => {
      const response = await fetch(`${API_BASE_URL}/files`, {
        method: 'GET',
        headers: getHeaders(),
      });
      return handleResponse(response);
    },

    upload: async (encryptedBlob, fileMetadata) => {
      const formData = new FormData();
      // Append encrypted file blob
      formData.append('file', encryptedBlob, fileMetadata.name);
      // Append other metadata fields
      formData.append('name', fileMetadata.name);
      formData.append('type', fileMetadata.type);
      formData.append('size', fileMetadata.size);
      formData.append('encryptionKey', fileMetadata.encryptionKey);

      const response = await fetch(`${API_BASE_URL}/files/upload`, {
        method: 'POST',
        headers: getHeaders(true), // true for multipart (no JSON Content-Type)
        body: formData,
      });
      return handleResponse(response);
    },

    download: async (fileId) => {
      const token = localStorage.getItem('sv_token');
      const response = await fetch(`${API_BASE_URL}/files/download/${fileId}`, {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Download failed');
      }

      // We need to return both the ciphertext (as text) and the decryption key,
      // which is returned in headers or we fetch metadata first.
      // A clean way is that this endpoint returns JSON containing the ciphertext and key,
      // or we return the binary/text file, and the metadata contains the key.
      // Let's have the endpoint return a JSON object with: { ciphertext: "...", key: "...", name: "..." }
      // OR let's return it as JSON for ease of parsing ciphertext and metadata.
      return response.json();
    },

    rename: async (fileId, newName) => {
      const response = await fetch(`${API_BASE_URL}/files/rename/${fileId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ name: newName }),
      });
      return handleResponse(response);
    },

    delete: async (fileId) => {
      const response = await fetch(`${API_BASE_URL}/files/${fileId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
  },

  // File Sharing
  sharing: {
    createLink: async (fileId, expiresAt) => {
      const response = await fetch(`${API_BASE_URL}/files/share`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ fileId, expiresAt }),
      });
      return handleResponse(response);
    },

    revokeLink: async (shareId) => {
      const response = await fetch(`${API_BASE_URL}/files/share/revoke/${shareId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return handleResponse(response);
    },

    getSharedFile: async (shareId) => {
      const response = await fetch(`${API_BASE_URL}/shared/${shareId}`, {
        method: 'GET',
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
  },
};

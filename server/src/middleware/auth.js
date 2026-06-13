const { admin, isFirebaseConfigured } = require('../config/firebase');

/**
 * Authentication Middleware.
 * Verifies the Bearer Token and injects user info into req.user.
 */
module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required. Missing token.' });
  }

  const token = authHeader.split('Bearer ')[1];

  if (isFirebaseConfigured && admin) {
    try {
      // Cryptographically verify the actual Firebase ID Token JWT
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        displayName: decodedToken.name || decodedToken.email.split('@')[0]
      };
      return next();
    } catch (error) {
      console.error('Firebase Auth Verification failed:', error.message);
      return res.status(403).json({ message: 'Authentication failed. Token is invalid or expired.' });
    }
  } else {
    // Simulated Mock Verification
    if (token.startsWith('mock-token-')) {
      const uid = token.replace('mock-token-', '');
      // In mock mode, we assume validation is successful for local requests
      req.user = {
        uid: uid,
        email: req.headers['x-mock-email'] || `${uid.substring(0, 8)}@securevault.local`,
        displayName: req.headers['x-mock-name'] || uid.substring(0, 8)
      };
      return next();
    } else {
      return res.status(403).json({ message: 'Authentication failed. Invalid simulated token.' });
    }
  }
};

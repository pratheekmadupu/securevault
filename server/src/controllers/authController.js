const { addAuditLog, getAuditLogs } = require('../config/firebase');

/**
 * Syncs user auth session and logs authentication events.
 */
const syncUser = async (req, res) => {
  try {
    const { uid, email, displayName } = req.body;
    
    if (!uid || !email) {
      return res.status(400).json({ message: 'Incomplete payload fields.' });
    }

    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    // Log the successful authentication event
    await addAuditLog({
      userId: uid,
      action: 'USER_LOGIN',
      details: `Operator session established for display name: "${displayName}" (${email})`,
      status: 'SUCCESS',
      ipAddress,
      userAgent
    });

    res.status(200).json({ message: 'Operator session synced successfully.' });
  } catch (error) {
    console.error('Error syncing user:', error);
    res.status(500).json({ message: 'Internal server error during session synchronization.' });
  }
};

/**
 * Retrieves audit logs for the authenticated operator.
 */
const getLogs = async (req, res) => {
  try {
    const userId = req.user.uid;
    const logsList = await getAuditLogs(userId);
    res.status(200).json(logsList);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ message: 'Failed to retrieve audit log ledger.' });
  }
};

module.exports = {
  syncUser,
  getLogs
};

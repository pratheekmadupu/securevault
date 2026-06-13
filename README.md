# 🛡️ SecureVault – Encrypted File Storage System

SecureVault is a production-ready, zero-knowledge cloud file storage and sharing platform built on cybersecurity best practices. It enables operators to upload, manage, download, and temporarily share documents with absolute confidentiality. 

By leveraging **client-side End-to-End Encryption (E2EE)** using **AES-256**, documents are encrypted inside the operator's browser before ever being transmitted over the network or stored in cloud storage. 

---

## 🔒 Security Architecture & Core Pillars

### 1. Client-Side End-to-End Encryption (E2EE)
* **Zero-Knowledge Storage:** Plaintext files never touch the network or servers.
* **Symmetric Encryption:** Files are encrypted in-browser using standard AES-256 in Cipher Block Chaining (CBC) mode with a unique key generated per file using cryptographically secure random number generation (CSPRNG).
* **Local Decryption:** Ciphertext payloads are downloaded and decrypted client-side only after positive identity authentication and authorization.

### 2. Insecure Direct Object Reference (IDOR) Protection
* The Express backend enforces rigorous validation middleware on all resource requests.
* UIDs extracted from Firebase Auth tokens are matched against Firestore metadata records to prevent path-traversal or direct ID requests from unauthorized sessions.

### 3. Self-Expiring Shared Access Pipelines
* Operators can provision temporary download tunnels with configurable lifespans (1 hour, 24 hours, 7 days).
* The backend strictly rejects requests to download files once the link's expiration timestamp is breached.
* Revocation commands delete access metadata immediately, rendering existing shares cryptographically invalid.

### 4. Tamper-Evident Audit Logging
* All security-critical events (Operator logins, E2EE uploads, local decryptions, share generation, revocations, and shredding) generate structured audit entries.
* Logs log client IP addresses, browser User Agent signatures, transaction actions, and success/failure states.

---

## 🛠️ Technology Stack

* **Frontend:** React.js, JavaScript, Custom Vanilla CSS Design System (Neon Dark Theme, Glassmorphism, Responsive Grid Layouts), Lucide Icons
* **Backend:** Node.js, Express.js, Multer (In-memory buffer processing)
* **Authentication:** Firebase Client Auth SDK
* **Database & Metadata:** Firebase Firestore
* **Object Storage:** Firebase Cloud Storage
* **Encryption engine:** AES-256 via CryptoJS
* **Router & State:** React Router DOM, React Context API

---

## 📁 Repository Structure

```
securevault/
├── client/                     # Frontend React Application
│   ├── src/
│   │   ├── assets/             # Static Assets
│   │   ├── components/         # Reusable UI Elements (Navbar, Portals)
│   │   ├── contexts/           # React State Contexts (Auth, Files, Toast)
│   │   ├── pages/              # Routing Viewports (Dashboard, Logs, Upload, etc.)
│   │   ├── services/           # Backend API Wrappers & CryptoJS Crypto Drivers
│   │   ├── App.jsx             # Routes & Provider Wiring
│   │   ├── index.css           # Global Neon Glassmorphism CSS Stylesheet
│   │   └── main.jsx            # Entry point
│   ├── .env                    # Client Config Environment file
│   └── package.json            # Client Dependencies
├── server/                     # Backend Express REST API
│   ├── src/
│   │   ├── config/             # DB & Storage Adapter (Firebase / Local Fallback)
│   │   ├── controllers/        # Controllers (Auth sessions, File actions)
│   │   ├── middleware/         # Token Authentication Check Middleware
│   │   └── routes/             # REST Route mappings
│   ├── .env                    # Server Config Environment file
│   └── server.js               # Entry point Express Server
├── .env.example                # Unified Environment Variable Template
└── README.md                   # System Documentation
```

---

## ⚙️ Setup & Installation

### Step 1: Install Dependencies

#### Install Client packages:
```bash
cd client
npm install
```

#### Install Server packages:
```bash
cd ../server
npm install
```

### Step 2: Configuration (Environment Variables)

SecureVault includes an **automatic local simulation database fallback**. If no Firebase credentials are provided, the system runs as a self-contained, out-of-the-box local node (simulating Firestore using local JSON files and Cloud Storage using a local directory).

To run in live mode with Firebase, copy the `.env.example` template to `.env` in both folders and fill in your keys:

#### For the client (`client/.env`):
```env
VITE_API_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-bucket.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

#### For the server (`server/.env`):
```env
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
FIREBASE_SERVICE_ACCOUNT_KEY={"type": "service_account", "project_id": "your-project-id", ...}
FIREBASE_STORAGE_BUCKET=your-bucket.appspot.com
```

---

## 🚀 Running the Platform

To demonstrate the application, run both modules concurrently.

1. **Start the Express API Server:**
   ```bash
   cd server
   npm run dev
   ```
   The backend will launch at `http://localhost:5000` and confirm either `Connected to Firebase Admin SDK` or `Running local JSON DB and storage fallback`.

2. **Start the React Frontend:**
   ```bash
   cd client
   npm run dev
   ```
   The client will compile and host locally at `http://localhost:5173`. Open this URL in your web browser.

---

## 🛡️ Firebase Security Rules

For live deployment, secure your database and storage buckets by applying the following rule schemas:

### Firestore Rules (`firestore.rules`)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Audit logs: Only the user can read/write their own logs
    match /logs/{logId} {
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    // File metadata ownership rules
    match /files/{fileId} {
      allow create, read, update, delete: if request.auth != null && resource.data.ownerId == request.auth.uid;
      // Allow read access to public sharing entries if active
      allow read: if resource.data.sharing.active == true;
    }
  }
}
```

### Storage Rules (`storage.rules`)
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /uploads/{userId}/{allPaths=**} {
      // Secure files so only the authenticated file owner can read or write
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 🔬 Demonstration & Test Account

When running in the default **local simulation mode** (no environment variables required):

* **Create Account:** Click **Register Node** on the landing page and register a mock email and passphrase. The password validator will enforce standard complexity checkmarks (uppercase, lowercase, number, special symbol, 8+ characters).
* **Reset Database:** To erase all local mock uploads, user registrations, and log histories, navigate to **Settings** and click **Purge Local Ledgers**.
* **E2EE Inspection:** The upload screen features an active *Cipher Stage Controller* terminal which outputs the generated AES key and tracks the local cryptography processing sequence prior to streaming to the server.

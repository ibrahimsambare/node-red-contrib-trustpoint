# node-red-contrib-trustpoint

**A complete Node-RED nodeset for managing cryptographic keys and certificates using the Trustpoint EST protocol (Enrollment over Secure Transport).**  
Supports full EST device lifecycle management, including secure key generation, CSR creation, certificate enrollment, renewal, storage, and CA retrieval.  
Designed for industrial and IoT provisioning workflows. Tested on Raspberry Pi 5 for ProductionLab Wall demo.

## v1.0.3 – 2025-07-16

### Improvements
- Made `filePath` optional for `trustpoint-store-key` and `trustpoint-store-certificate` nodes
- Automatically creates default folders under `userDir` (`keys/`, `certs/`)
- Improved `.html` UI logic with dynamic preview and user-friendly messages
- Added flow examples for several usecases

### 💡 Notes
- Leaving `filePath` blank now stores files in a portable directory inside your Node-RED setup
- No breaking changes – existing flows continue to work

## Features

- 📌 **Device key generation**  
  Generate RSA or Elliptic Curve (EC) private keys (configurable key size / curve).

- 📌 **CSR creation**  
  Create Certificate Signing Requests (CSR) from private keys, with configurable subject fields.

- 📌 **Full certificate enrollment**  
  Perform device enrollment with EST `/simpleenroll` endpoint, retrieve device certificates.

- 📌 **Certificate renewal**  
  Re-enroll devices using existing keys and certificates via `/simplereenroll` endpoint.

- 📌 **Certificate & key storage**  
  Save certificates and private keys to disk or Node-RED context, with extracted metadata (validity dates, subject CN, issuer CN).

- 📌 **CA certificate retrieval**  
  Retrieve and store CA certificate chain from EST `/cacerts` endpoint.

- 📌 **Node-RED integration**  
  Fully modular and reusable nodes, with flexible UI and payload structure.

- 📌 **Production-ready**  
  Tested on Raspberry Pi 5 (ProductionLab Wall demo), compatible with industrial IoT provisioning workflows.


## Required Packages

To run the example flows successfully, make sure the following packages are installed in your Node-RED environment:

### 1. Custom Nodeset (this package)
- `node-red-contrib-trustpoint`  
  Your custom nodeset (this repository). Install it manually or via the Palette Manager.

### 2. Built-in Core Nodes (preinstalled in Node-RED)
- `inject`
- `debug`
- `function`

These are included by default in Node-RED.

### 3. Optional (for UI flows)
If you're using Dashboard features (e.g., forms, buttons, charts), you will also need:

- `node-red-dashboard`
  ```bash
  npm install node-red-dashboard

  
## Nodes included

| Node                               | Purpose                                                                                         |
|------------------------------------|-------------------------------------------------------------------------------------------------|
| `trustpoint-keygen`                | Generate RSA or EC private keys (configurable key size / curve).                                |
| `trustpoint-create-csr`            | Create a CSR from a private key, with configurable subject fields (CN, O, OU, etc.).            |
| `trustpoint-build-enroll-payload`  | Prepare the payload for EST enrollment, injecting CSR and credentials.                          |
| `trustpoint-simpleenroll`          | Perform certificate enrollment using the EST `/simpleenroll` endpoint.                          |
| `trustpoint-simplereenroll`        | (Optional) Perform certificate renewal using EST `/simplereenroll` endpoint.                    |
| `trustpoint-prepare-keystore`      | Prepare the keystore object and structure for re-use, including key, cert, and identifiers.     |
| `trustpoint-store-key`             | Save private key to disk, using a sanitized device ID as filename.                              |
| `trustpoint-store-certificate`     | Save the issued certificate to disk and extract metadata (CNs, validity dates, key info, etc.). |
| `trustpoint-cacerts`               | Retrieve the CA certificate chain from the EST `/cacerts` endpoint.                             |

---

## Installation

### Prerequisites

- Node-RED >= 3.x
- Node.js >= 18.x (tested with latest LTS)
- EST server compatible with RFC 7030 (Enrollment over Secure Transport)

All required dependencies will be installed automatically, including:

node-forge
request

⚠️ If using Node-RED via Docker, make sure to run the install command inside the container:

```bash
docker exec -it <your-container-name>
cd /data
npm install node-red-contrib-trustpoint
```


### Install via Node-RED Palette Manager

You can install this nodeset directly from the Node-RED editor:

1. Open the Node-RED editor in your browser
2. Click the menu (☰) → *Manage palette* → *Install*
3. Search for: `node-red-contrib-trustpoint`
4. Click *Install*

The Trustpoint nodes will appear under the **"Trustpoint"** category in the palette.



### Manual installation (development mode)

You can also install it manually from source:

```bash
cd ~/.node-red
git clone https://github.com/ibrahimsambare/node-red-contrib-trustpoint.git
cd node-red-contrib-trustpoint
npm install
sudo npm link
cd ~/.node-red
npm link node-red-contrib-trustpoint
node-red-restart
```

Or restart Node-RED with this command:

```bash
node-red-stop
node-red-start
```

→ After restart, the Trustpoint nodes will be available in the Node-RED palette.


## Example Flows

### 1️⃣ CA Certificate Retrieval Flow

Purpose:

Retrieve CA chain from EST /cacerts endpoint and store CA certificates as .pem or .p7b file.

```plaintext
inject → trustpoint-cacerts → trustpoint-store-certificate → debug
```

### 2️⃣ Full Device Enrollment Flow

Purpose:

Generate device key (RSA or EC).
Create CSR with configurable subject.
Perform certificate enrollment via EST /simpleenroll.
Store device certificate on disk and extract metadata.

```plaintext
inject
  → trustpoint-keygen
  → trustpoint-prepare-keystore
  → trustpoint-store-key
  → trustpoint-create-csr
  → trustpoint-build-enroll-payload
  → trustpoint-simpleenroll
  → trustpoint-store-certificate
  → debug
```
### 3️⃣ Device Re-enrollment Flow

Purpose:

Use existing device private key and certificate.
Generate a new CSR with same key.
Perform certificate renewal via EST /simplereenroll.
Store updated device certificate.
```plaintext
file-in (read existing key) + file-in (read existing cert)
inject
  → trustpoint-keygen
  → trustpoint-prepare-keystore
  → trustpoint-store-key
  → trustpoint-create-csr
  → trustpoint-build-enroll-payload
  → trustpoint-simpleenroll
  → trustpoint-store-certificate
  → debug
```

---

### Example Flow JSON files
👉 Full example flow definitions (.json) are available in the examples/ folder:


---

## Compatibility

✅ Tested on:

- Raspberry Pi 5 (64-bit Raspberry Pi OS, official OS image)  
  → Physical Demo Setup for ProductionLab Wall  
  → Node-RED installed and running as system service

- macOS (development environment)  
  → Node-RED running locally with node-red-contrib-trustpoint nodeset

- Linux x64 (Ubuntu 22.04)  
  → Node-RED running locally, manual installation of nodeset

✅ Node-RED version:

- Node-RED 3.x → tested and validated

✅ Node.js version:

- Node.js 18.x LTS → tested and validated
- Node.js 20.x LTS → partial tests performed (no issues observed)

✅ EST server compatibility:

- Trustpoint EST server (ProductionLab test instance)
- `/simpleenroll`, `/simplereenroll`, `/cacerts` endpoints tested during Phase 1


---

## Roadmap

✅ Phase 1 (completed):

- Develop full `node-red-contrib-trustpoint` nodeset:
  - `trustpoint-keygen`
  - `trustpoint-create-csr`
  - `trustpoint-simpleenroll`
  - `trustpoint-simplereenroll`
  - `trustpoint-store`
  - `trustpoint-cacerts`

- Build and test core flows:
  - CA retrieval flow → OK
  - Full device enrollment flow → OK
  - Device re-enrollment flow → Partially OK (HTTP 500 under investigation)

- Write technical report → Completed
- Prepare initial README → In progress

---

✅ Phase 2 (completed):

- Prepare Raspberry Pi 5 environment (official OS, SSH, Node-RED installation)
- Deploy `node-red-contrib-trustpoint` nodeset on Raspberry Pi 5
- Validate flows on ProductionLab Wall
- Demo physical setup to Trustpoint team

---

✅ Phase 3 (completed):

- Add and test full mTLS support (client cert + client key for all endpoints)
- Investigate and resolve `/simplereenroll` HTTP 500 issue
- Add reusable Node-RED configuration node (`trustpoint-config`) if needed
- Implement automated test flows (unit + integration tests)
- Add CI/CD pipeline (GitHub Actions)
- Publish nodeset to npm and Node-RED Flow Library
- Provide additional advanced example flows (auto-renewal, MQTT integration, etc.)

---

✅ Phase 4 (completed)
- Implement advanced enrollment strategies:
- Certificate renewal via /simplereenroll with valid client certificate
- Enrollment retry mechanisms and error handling
- Add Node-RED Dashboard templates for user-friendly device provisioning
- Develop full demo for MQTT over mTLS using enrolled certificates
- Publish documentation site (e.g., GitHub Pages or MkDocs)
- Optimize node UI and UX (tooltips, help descriptions, validation)
- Engage with the community via Node-RED Flow Library feedback and GitHub Issues

  
## License

MIT License

Copyright (c) 2025 Ibrahim Almountaka Sambare

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE
AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

---

## Author

**Ibrahim Almountaka Sambare**  
Developer of `node-red-contrib-trustpoint`  
Phase 1 — Trustpoint Project (ProductionLab Wall demo)  
2025

GitHub: [https://github.com/ton-profil-github](https://github.com/ibrahimsambare)  
Email: <ibrahim.realmountaka@campus-schwartwald.de>





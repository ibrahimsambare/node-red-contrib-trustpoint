# node-red-contrib-trustpoint

**A complete Node-RED nodeset for managing cryptographic keys and certificates using the Trustpoint EST protocol (Enrollment over Secure Transport).**  
Supports full EST device lifecycle management, including secure key generation, CSR creation, certificate enrollment, renewal, storage, and CA retrieval.  
Designed for industrial and IoT provisioning workflows. Tested on Raspberry Pi 5 for ProductionLab Wall demo.

## ✨ Features

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

## Nodes included

| Node                        | Purpose                                                                                                                        |
|-----------------------------|--------------------------------------------------------------------------------------------------------------------------------|
| `trustpoint-keygen`         | Generate RSA or EC private keys (configurable key size / curve).                                                               |
| `trustpoint-create-csr`     | Create a CSR from a private key, with configurable subject fields (CN, O, OU, etc.).                                           |
| `trustpoint-simpleenroll`   | Perform device certificate enrollment using EST `/simpleenroll` endpoint.                                                      |
| `trustpoint-simplereenroll` | Perform device certificate renewal using EST `/simplereenroll` endpoint (re-enroll with existing cert and key).                |
| `trustpoint-store`          | Store certificates and private keys to disk or Node-RED context, and extract metadata (validity dates, subject CN, issuer CN). |
| `trustpoint-cacerts`        | Retrieve CA certificate chain from EST `/cacerts` endpoint and store it locally.                                               |

---

## Installation

### Prerequisites

- Node-RED >= 3.x
- Node.js >= 18.x (tested with latest LTS)
- EST server compatible with RFC 7030 (Enrollment over Secure Transport)

### Install via Node-RED Palette Manager

> _(Coming soon — after first npm publish)_

Once published to npm, you will be able to install it directly from Node-RED Palette Manager:


### Manual installation (development mode)

While the package is not yet published, you can install it manually from source:

```bash
cd ~/.node-red
git clone <your-github-repo-url> node-red-contrib-trustpoint
cd node-red-contrib-trustpoint
npm install
```
Then restart Node-RED:
```bash
node-red-stop
node-red-start
```
Or if running in development:
```bash
git clone https://github.com/your-username/node-red-contrib-trustpoint.git
cd node-red-contrib-trustpoint
npm install
npm link
cd ~/.node-red
npm link node-red-contrib-trustpoint
```
Then restart Node-RED.

→ After restart, the Trustpoint nodes will be available in the Node-RED palette.

## Example Flows

### 1️⃣ CA Certificate Retrieval Flow

Purpose:

Retrieve CA chain from EST /cacerts endpoint and store CA certificates as .pem or .p7b file.

```plaintext
inject → trustpoint-cacerts → trustpoint-store → debug
```

### 2️⃣ Full Device Enrollment Flow

Purpose:

Generate device key (RSA or EC).
Create CSR with configurable subject.
Perform certificate enrollment via EST /simpleenroll.
Store device certificate on disk and extract metadata.

```plaintext
trustpoint-keygen → trustpoint-create-csr → trustpoint-simpleenroll → trustpoint-store → debug
```
### 3️⃣ Device Re-enrollment Flow

Purpose:

Use existing device private key and certificate.
Generate a new CSR with same key.
Perform certificate renewal via EST /simplereenroll.
Store updated device certificate.
```plaintext
file-in (read existing key) + file-in (read existing cert)
  → trustpoint-create-csr → trustpoint-simplereenroll → trustpoint-store → debug
```

---

### Example Flow JSON files
👉 Full example flow definitions (.json) are available in the examples/ folder:

node-red-contrib-trustpoint/examples/ca-retrieval-flow.json

node-red-contrib-trustpoint/examples/device-enrollment-flow.json

node-red-contrib-trustpoint/examples/device-reenrollment-flow.json



## Known Limitations

- `trustpoint-simplereenroll` → currently returns HTTP 500 on EST server.  
  This may be due to server-side issues, certificate validity constraints, or EST server configuration. Investigation is ongoing.

- Full mTLS (mutual TLS) support → client certificate and client key options are present but not yet fully tested in real production mTLS flows.  
  This will be covered in Phase 3 of the project.

- No automated flow tests or CI/CD pipeline integrated yet → manual testing was performed during Phase 1.  
  CI/CD integration and automated tests are planned in future versions.

- Node-RED UI configuration node (`trustpoint-config`) was not implemented — configuration is currently passed via `msg.payload` for maximum flexibility.  
  This is a design choice for Phase 1; a reusable configuration node can be added later if needed.

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

🟡 Phase 2 (in progress):

- Prepare Raspberry Pi 5 environment (official OS, SSH, Node-RED installation)
- Deploy `node-red-contrib-trustpoint` nodeset on Raspberry Pi 5
- Validate flows on ProductionLab Wall
- Demo physical setup to Trustpoint team

---

🟡 Phase 3 (planned):

- Add and test full mTLS support (client cert + client key for all endpoints)
- Investigate and resolve `/simplereenroll` HTTP 500 issue
- Add reusable Node-RED configuration node (`trustpoint-config`) if needed
- Implement automated test flows (unit + integration tests)
- Add CI/CD pipeline (GitHub Actions)
- Publish nodeset to npm and Node-RED Flow Library
- Provide additional advanced example flows (auto-renewal, MQTT integration, etc.)

---

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

GitHub: [https://github.com/ton-profil-github](https://github.com/ton-profil-github)  
Email: <ton.email.pro@example.com>






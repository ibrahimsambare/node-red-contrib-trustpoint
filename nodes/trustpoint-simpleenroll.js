const https = require('https');
const forge = require('node-forge'); // Needed for PEM to DER conversion

module.exports = function (RED) {
    function TrustpointSimpleEnrollNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        // Static config from the HTML editor
        node.estHost = config.estHost;
        node.useBasic = config.useBasic;
        node.username = config.username;
        node.password = config.password;
        node.useMtls = config.useMtls;
        node.clientCert = config.clientCert;
        node.clientKey = config.clientKey;

        node.on('input', function (msg) {
            const estBaseUrl = msg.payload?.estBaseUrl || node.estHost;
            if (!estBaseUrl) {
                node.error("Missing estBaseUrl in msg.payload or node config.");
                return;
            }

            const csrInput = msg.payload?.csr || msg.payload;
            if (!csrInput) {
                node.error("Missing CSR in msg.payload or payload.csr");
                return;
            }

            let csrBuffer;

            if (Buffer.isBuffer(csrInput)) {
                node.log("CSR input is Buffer → OK");
                csrBuffer = csrInput;
            } else if (typeof csrInput === 'string' && csrInput.includes('BEGIN CERTIFICATE REQUEST')) {
                node.log("CSR input is PEM String → converting to Buffer (DER)");
                try {
                    const pemMessage = forge.pem.decode(csrInput)[0];
                    csrBuffer = Buffer.from(pemMessage.body);
                } catch (err) {
                    node.error(`Error converting PEM to Buffer → ${err.message}`);
                    return;
                }
            } else {
                node.error("CSR input is not valid → expected Buffer or PEM String");
                return;
            }

            node.status({ fill: "blue", shape: "dot", text: "Sending Enrollment request..." });

            const urlObj = new URL(estBaseUrl);

            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port || 443,
                path: urlObj.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/pkcs10',
                    'Content-Length': csrBuffer.length
                },
                rejectUnauthorized: false
            };

            const useBasic = msg.payload?.useBasic !== undefined ? msg.payload.useBasic : node.useBasic;
            const username = msg.payload?.username || node.username;
            const password = msg.payload?.password || node.password;

            if (useBasic && username && password) {
                const authString = `${username}:${password}`;
                options.headers['Authorization'] = 'Basic ' + Buffer.from(authString).toString('base64');
            }

            if (node.useMtls && node.clientCert && node.clientKey) {
                options.cert = node.clientCert;
                options.key = node.clientKey;
            }

            const req = https.request(options, (res) => {
                const chunks = [];

                res.on('data', (chunk) => {
                    chunks.push(chunk);
                });

                res.on('end', () => {
                    const body = Buffer.concat(chunks);
                    node.status({ fill: "green", shape: "dot", text: `Status: ${res.statusCode}` });

                    try {
                        const asn1Cert = forge.asn1.fromDer(body.toString('binary'));
                        const cert = forge.pki.certificateFromAsn1(asn1Cert);
                        const pemCert = forge.pki.certificateToPem(cert);

                        msg.payload = pemCert;
                    } catch (err) {
                        node.warn(`Failed to parse DER cert → passing raw body`);
                        msg.payload = body;
                    }

                    msg.statusCode = res.statusCode;
                    msg.headers = res.headers;
                    node.send(msg);
                });
            });

            req.on('error', (err) => {
                node.status({ fill: "red", shape: "ring", text: "Error" });
                node.error(`SimpleEnroll request failed: ${err.message}`, msg);
            });

            req.write(csrBuffer);
            req.end();
        });
    }

    RED.nodes.registerType("trustpoint-simpleenroll", TrustpointSimpleEnrollNode);
};

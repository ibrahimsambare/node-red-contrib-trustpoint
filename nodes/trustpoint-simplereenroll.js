const https = require('https');
const forge = require('node-forge');

module.exports = function (RED) {
    function TrustpointSimpleReenrollNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.on('input', function (msg) {
            const estBaseUrl = msg.payload?.estBaseUrl;
            const clientCertPem = msg.payload?.cert || config.cert;
            const clientKeyPem = msg.payload?.key || config.key;

            if (!estBaseUrl || !clientCertPem || !clientKeyPem) {
                return node.error("Missing estBaseUrl, cert, or key in msg.payload");
            }

            try {
                const urlObj = new URL(estBaseUrl);

                const cert = forge.pki.certificateFromPem(clientCertPem);
                const key = forge.pki.privateKeyFromPem(clientKeyPem);

                const csr = forge.pki.createCertificationRequest();
                csr.publicKey = cert.publicKey;
                csr.setSubject(cert.subject.attributes);
                csr.sign(key);

                const csrDer = Buffer.from(
                    forge.asn1.toDer(forge.pki.certificationRequestToAsn1(csr)).getBytes(),
                    'binary'
                );

                const options = {
                    hostname: urlObj.hostname,
                    port: urlObj.port || 443,
                    path: urlObj.pathname,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/pkcs10',
                        'Content-Length': csrDer.length
                    },
                    key: clientKeyPem,
                    cert: clientCertPem,
                    rejectUnauthorized: false // For dev; set to true in prod
                };

                node.status({ fill: "blue", shape: "dot", text: "Sending ReEnroll request..." });

                const req = https.request(options, res => {
                    let chunks = [];

                    res.on('data', chunk => chunks.push(chunk));
                    res.on('end', () => {
                        const buffer = Buffer.concat(chunks);

                        node.status({ fill: "green", shape: "dot", text: `Status: ${res.statusCode}` });

                        if (res.statusCode === 200) {
                            try {
                                // Robust PKCS#7 parsing
                                const p7asn1 = forge.asn1.fromDer(buffer.toString('binary'));
                                const p7 = forge.pkcs7.messageFromAsn1(p7asn1);
                                const pemCerts = p7.certificates.map(cert => forge.pki.certificateToPem(cert));

                                msg.payload = pemCerts;
                                node.send(msg);
                            } catch (e) {
                                node.error("Failed to parse renewed certificate (PKCS#7 expected): " + e.message, msg);
                            }
                        } else {
                            node.error(`Re-enrollment failed (HTTP ${res.statusCode})`, msg);
                        }
                    });
                });

                req.on('error', err => {
                    node.status({ fill: "red", shape: "ring", text: "Error" });
                    node.error("HTTPS error: " + err.message, msg);
                });

                req.write(csrDer);
                req.end();

            } catch (e) {
                node.error("Reenrollment error: " + e.message, msg);
            }
        });
    }

    RED.nodes.registerType("trustpoint-simplereenroll", TrustpointSimpleReenrollNode);
};

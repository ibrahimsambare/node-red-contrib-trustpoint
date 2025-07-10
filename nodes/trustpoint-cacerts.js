const https = require('https');
const fs = require('fs');
const forge = require('node-forge');

module.exports = function (RED) {
    function TrustpointCaCertsNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.on('input', function (msg) {
            const estUrl = config.estUrl || msg.estUrl;
            if (!estUrl) {
                node.error("EST URL is required (msg.estUrl or config)");
                return;
            }

            const url = new URL(estUrl);

            const options = {
                hostname: url.hostname,
                port: url.port || 443,
                path: url.pathname,
                method: 'GET',
                rejectUnauthorized: false,
                headers: {
                    'Accept': 'application/pkcs7-mime'
                }
            };

            const req = https.request(options, res => {
                const chunks = [];

                res.on('data', d => chunks.push(d));
                res.on('end', () => {
                    const buffer = Buffer.concat(chunks);

                    try {
                        const outputPath = "/home/pi/.node-red/certs/ca-certs.p7b";
                        fs.mkdirSync("/home/pi/.node-red/certs", { recursive: true });
                        fs.writeFileSync(outputPath, buffer);

                        // Convert PKCS#7 DER → ASN.1
                        const p7Asn1 = forge.asn1.fromDer(buffer.toString('binary'));
                        const pkcs7 = forge.pkcs7.messageFromAsn1(p7Asn1);

                        const certs = pkcs7.certificates || [];
                        const pemCerts = certs.map(c => forge.pki.certificateToPem(c)).join('\n');

                        const certInfos = certs.map(cert => ({
                            subject: cert.subject.attributes.map(attr => ({ name: attr.name, value: attr.value })),
                            issuer: cert.issuer.attributes.map(attr => ({ name: attr.name, value: attr.value })),
                            validFrom: cert.validity.notBefore,
                            validTo: cert.validity.notAfter,
                            serialNumber: cert.serialNumber
                        }));

                        msg.payload = {
                            status: "stored",
                            path: outputPath
                        };

                        msg.pemCertsPreview = pemCerts;
                        msg.caCertInfo = certInfos;

                        node.send(msg);
                    } catch (e) {
                        node.error("Failed to parse PKCS7: " + e.message, msg);
                    }
                });
            });

            req.on('error', error => {
                node.error("HTTPS request failed: " + error.message, msg);
            });

            req.end();
        });
    }

    RED.nodes.registerType("trustpoint-cacerts", TrustpointCaCertsNode);
};

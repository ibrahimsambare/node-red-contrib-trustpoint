const https = require('https');
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
                    msg.payload = buffer; // Buffer brut (PKCS#7)

                    try {
                        // Parse DER buffer -> PEM certs
                        const p7asn1 = forge.asn1.fromDer(buffer.toString('binary'));
                        const p7 = forge.pkcs7.messageFromAsn1(p7asn1);
                        const certs = p7.certificates.map(cert => forge.pki.certificateToPem(cert));

                        msg.pemCerts = certs;

                        // Aperçu des 10 premières lignes du premier certificat
                        if (certs.length > 0) {
                            const lines = certs[0].split('\n');
                            msg.pemCertsPreview = lines.slice(0, 10).join('\n') + '\n...';
                        } else {
                            msg.pemCertsPreview = "No certificates found in PKCS#7 response.";
                        }

                        node.log(`CA certs retrieved (${certs.length} certs, ${buffer.length} bytes)`);
                    } catch (err) {
                        msg.pemCerts = null;
                        msg.pemCertsPreview = "Error parsing PKCS#7 → " + err.message;
                        node.warn("Failed to parse PKCS#7: " + err.message);
                    }

                    node.send(msg);
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

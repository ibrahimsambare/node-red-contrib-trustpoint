const fs = require('fs');
const path = require('path');
const forge = require('node-forge');

module.exports = function (RED) {
    function TrustpointStoreCertificateNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.on('input', function (msg, send, done) {
            try {
                const certPem = msg.payload?.certificate;
                const deviceId = msg.payload?.deviceId || msg.deviceId || 'unknown-device';

                if (!certPem || !certPem.includes("BEGIN CERTIFICATE")) {
                    node.error("Missing or invalid PEM certificate in msg.payload.certificate", msg);
                    return;
                }

                // 📁 Déterminer automatiquement le chemin de stockage
                const filePath = path.join("/home/pi/.node-red/certs-mqtt", `${deviceId}-cert.pem`);
                fs.writeFileSync(filePath, certPem, 'utf8');
                node.log(`Certificate stored at: ${filePath}`);

                // 🔍 Extraction des métadonnées avec node-forge
                const cert = forge.pki.certificateFromPem(certPem);

                msg.certMeta = {
                    subjectCN: cert.subject.getField('CN')?.value || '',
                    issuerCN: cert.issuer.getField('CN')?.value || '',
                    validFrom: cert.validity.notBefore.toISOString(),
                    validTo: cert.validity.notAfter.toISOString(),
                    keyType: cert.publicKey.n ? 'RSA' : 'EC',
                    keySize: cert.publicKey.n ? cert.publicKey.n.bitLength() : cert.publicKey.curve?.name || '',
                    deviceId: deviceId
                };

                msg.payload = {
                    status: "stored",
                    path: filePath
                };

                send(msg);
                done();
            } catch (err) {
                node.error("Failed to process certificate: " + err.message, msg);
                done(err);
            }
        });
    }

    RED.nodes.registerType("trustpoint-store-certificate", TrustpointStoreCertificateNode);
};

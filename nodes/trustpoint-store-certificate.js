const fs = require('fs');
const path = require('path');
const forge = require('node-forge');

module.exports = function (RED) {
    function TrustpointStoreCertificateNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.on('input', function (msg, send, done) {
            try {
                let certPem = msg.payload?.certificate;
                const deviceId = msg.payload?.deviceId || msg.deviceId || 'unknown-device';

                if (!certPem) {
                    node.error("Missing certificate in msg.payload.certificate", msg);
                    return;
                }

                // Convert base64 to PEM if necessary
                if (!certPem.includes("BEGIN CERTIFICATE")) {
                    node.warn("Certificate in base64 detected — converting to PEM");
                    certPem = "-----BEGIN CERTIFICATE-----\n" +
                        certPem.match(/.{1,64}/g).join("\n") +
                        "\n-----END CERTIFICATE-----";
                }

                // Définir le répertoire cible
                let baseDir = config.filePath?.trim();
                if (!baseDir) {
                    baseDir = path.join(RED.settings.userDir || process.cwd(), "certs");
                }

                // Créer le dossier s’il n’existe pas
                if (!fs.existsSync(baseDir)) {
                    fs.mkdirSync(baseDir, { recursive: true });
                }

                // Sauvegarde du certificat
                const filePath = path.join(baseDir, `${deviceId}-cert.pem`);
                fs.writeFileSync(filePath, certPem, 'utf8');
                node.log(`Certificate stored at: ${filePath}`);

                // Extraction des métadonnées du certificat
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

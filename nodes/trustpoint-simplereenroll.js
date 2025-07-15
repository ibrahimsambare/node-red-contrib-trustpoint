const forge = require('node-forge');
const request = require('request');

module.exports = function (RED) {
    function TrustpointSimplereenrollNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        // Récupérer l'option "rejectUnauthorized" depuis l'interface (ou true par défaut)
        node.rejectUnauthorized = config.rejectUnauthorized !== false;

        node.on('input', function (msg, send, done) {
            const estUrl = config.estHost || msg.estUrl;
            const csrBuffer = msg.payload;

            if (!estUrl || !Buffer.isBuffer(csrBuffer)) {
                return done(new Error("Missing EST URL or CSR buffer"));
            }

            const username = msg.estUsername || msg.keystore?.estUsername || config.username;
            const password = msg.estPassword || msg.keystore?.estPassword || config.password;

            const options = {
                method: 'POST',
                url: estUrl,
                headers: {
                    'Content-Type': 'application/pkcs10',
                    'Content-Length': csrBuffer.length
                },
                body: csrBuffer,
                encoding: null,
                auth: username && password ? { user: username, pass: password } : undefined,
                rejectUnauthorized: node.rejectUnauthorized
            };

            request(options, (error, response, body) => {
                if (error) return done(error);

                try {
                    const derBuffer = Buffer.isBuffer(body) ? body : Buffer.from(body, 'binary');
                    const certAsn1 = forge.asn1.fromDer(derBuffer.toString('binary'));
                    const cert = forge.pki.certificateFromAsn1(certAsn1);
                    const certPem = forge.pki.certificateToPem(cert);

                    // ✅ Stocker dans un champ séparé
                    msg.certificate = certPem;
                    msg.deviceId = msg.deviceId || msg.keystore?.deviceId || (msg.payload && msg.payload.deviceId);

                    // ✅ Construction propre du payload final
                    msg.payload = {
                        certificate: msg.certificate,
                        deviceId: msg.deviceId
                    };

                    send(msg);
                    done();
                } catch (parseError) {
                    node.warn('Failed to parse DER cert → fallback parse attempt...');

                    try {
                        const derBuffer = Buffer.isBuffer(body) ? body : Buffer.from(body, 'binary');
                        const certAsn1 = forge.asn1.fromDer(derBuffer.toString('binary'));
                        const cert = forge.pki.certificateFromAsn1(certAsn1);
                        const certPemFallback = forge.pki.certificateToPem(cert);

                        msg.certificate = certPemFallback;
                        msg.deviceId = msg.deviceId || msg.keystore?.deviceId || (msg.payload && msg.payload.deviceId);

                        msg.payload = {
                            certificate: msg.certificate,
                            deviceId: msg.deviceId
                        };

                        send(msg);
                        done();
                    } catch (fallbackError) {
                        node.warn("Fallback failed — returning base64 certificate.");
                        const base64Cert = Buffer.isBuffer(body) ? body.toString('base64') : Buffer.from(body, 'binary').toString('base64');

                        msg.certificate = base64Cert;
                        msg.deviceId = msg.deviceId || msg.keystore?.deviceId || (msg.payload && msg.payload.deviceId);

                        msg.payload = {
                            certificate: msg.certificate,
                            deviceId: msg.deviceId
                        };

                        send(msg);
                        done();
                    }
                }
            });
        });
    }

    RED.nodes.registerType("trustpoint-simplereenroll", TrustpointSimplereenrollNode);
};

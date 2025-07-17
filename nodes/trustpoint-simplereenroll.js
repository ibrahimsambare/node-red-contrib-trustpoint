const forge = require('node-forge');
const request = require('request');

module.exports = function (RED) {
    function TrustpointSimplereenrollNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

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

                const derBuffer = Buffer.isBuffer(body) ? body : Buffer.from(body, 'binary');

                try {
                    // Tentative de parsing en DER
                    const certAsn1 = forge.asn1.fromDer(derBuffer.toString('binary'));
                    const cert = forge.pki.certificateFromAsn1(certAsn1);
                    const certPem = forge.pki.certificateToPem(cert);

                    msg.payload = {
                        certificate: certPem,
                        deviceId: msg.deviceId || msg.keystore?.deviceId || undefined,
                        format: "pem"
                    };

                    send(msg);
                    done();

                } catch (parseError) {
                    node.warn("Failed to parse DER certificate — attempting base64 fallback...");

                    const base64Cert = derBuffer.toString('base64');

                    msg.payload = {
                        certificate: base64Cert,
                        deviceId: msg.deviceId || msg.keystore?.deviceId || undefined,
                        format: "base64"
                    };

                    send(msg);
                    done();
                }
            });
        });
    }

    RED.nodes.registerType("trustpoint-simplereenroll", TrustpointSimplereenrollNode);
};

const forge = require('node-forge');
const request = require('request'); // ou `require('axios')` si tu l’utilises

module.exports = function (RED) {
    function TrustpointSimpleEnrollNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

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

            rejectUnauthorized: false
};


            request(options, (error, response, body) => {
                if (error) return done(error);

                try {
                    const derBuffer = Buffer.isBuffer(body) ? body : Buffer.from(body, 'binary');
                    const certAsn1 = forge.asn1.fromDer(derBuffer.toString('binary'));
                    const cert = forge.pki.certificateFromAsn1(certAsn1);
                    const certPem = forge.pki.certificateToPem(cert);

                    msg.payload = msg.payload || {};
                    msg.payload.certificate = certPem;
                    msg.payload.deviceId = msg.deviceId || msg.keystore?.deviceId || (msg.payload && msg.payload.deviceId);

                    send(msg);
                    done();
                } catch (parseError) {
                    node.warn('Failed to parse DER cert → passing raw body as Base64');
                    msg.payload = msg.payload || {};
                    try {
    const derBuffer = Buffer.isBuffer(body) ? body : Buffer.from(body, 'binary');
    const certAsn1 = forge.asn1.fromDer(derBuffer.toString('binary'));
    const cert = forge.pki.certificateFromAsn1(certAsn1);
    const certPemFallback = forge.pki.certificateToPem(cert);
    msg.payload.certificate = certPemFallback;
} catch (fallbackError) {
    node.warn("Fallback also failed, storing base64 instead.");
    msg.payload.certificate = body.toString('base64');
}

                    msg.payload.deviceId = msg.deviceId || msg.keystore?.deviceId || (msg.payload && msg.payload.deviceId);
                    send(msg);
                    done();
                }
            });
        });
    }

    RED.nodes.registerType("trustpoint-simpleenroll", TrustpointSimpleEnrollNode);
};

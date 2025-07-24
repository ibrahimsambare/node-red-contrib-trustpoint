const forge = require('node-forge');
const request = require('request');
const fs = require('fs');

module.exports = function (RED) {
    function TrustpointSimpleReEnrollNode(config) {
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

            // mTLS and CA setup
            const useMtls = config.useMtls || msg.useMtls;
            let clientCert = null, clientKey = null, caCert = null, serverKey = null;

            try {
                if (useMtls) {
                    const certPath = msg.clientCert || config.clientCert;
                    const keyPath = msg.clientKey || config.clientKey;
                    if (certPath && keyPath) {
                        clientCert = fs.readFileSync(certPath);
                        clientKey = fs.readFileSync(keyPath);
                    } else {
                        return done(new Error("mTLS is enabled but client certificate or key is missing."));
                    }
                }

                const caPath = msg.serverCert || config.serverCert;
                if (caPath) {
                    caCert = fs.readFileSync(caPath);
                }

                const skeyPath = msg.serverKey || config.serverKey;
                if (skeyPath) {
                    serverKey = fs.readFileSync(skeyPath);
                    msg.serverKey = serverKey.toString(); // optional: for debug or reuse
                }
            } catch (e) {
                return done(new Error("Failed to read certificate files: " + e.message));
            }

            const options = {
                method: 'POST',
                url: estUrl,
                headers: {
                    'Content-Type': 'application/pkcs10',
                    'Content-Length': csrBuffer.length
                },
                body: csrBuffer,
                encoding: null,
                rejectUnauthorized: node.rejectUnauthorized,
                cert: clientCert,
                key: clientKey,
                ca: caCert,
                auth: username && password ? { user: username, pass: password } : undefined
            };

            request(options, (error, response, body) => {
                if (error) return done(error);

                try {
                    const derBuffer = Buffer.isBuffer(body) ? body : Buffer.from(body, 'binary');
                    const certAsn1 = forge.asn1.fromDer(derBuffer.toString('binary'));
                    const cert = forge.pki.certificateFromAsn1(certAsn1);
                    const certPem = forge.pki.certificateToPem(cert);

                    msg.certificate = certPem;
                    msg.payload = { certificate: certPem };
                    send(msg);
                    done();
                } catch (parseError) {
                    try {
                        const asn1 = forge.asn1.fromDer(Buffer.from(body).toString('binary'));
                        const pkcs7 = forge.pkcs7.messageFromAsn1(asn1);
                        if (!pkcs7.certificates?.length) throw new Error("No certs in PKCS#7");

                        const certPem = forge.pki.certificateToPem(pkcs7.certificates[0]);
                        msg.payload = { certificate: certPem };
                        send(msg);
                        done();
                    } catch (fallbackError) {
                        const base64 = Buffer.isBuffer(body) ? body.toString('base64') : Buffer.from(body, 'binary').toString('base64');
                        msg.payload = { certificate: base64 };
                        send(msg);
                        done();
                    }
                }
            });
        });
    }

    RED.nodes.registerType("trustpoint-simplereenroll", TrustpointSimpleReEnrollNode);
};

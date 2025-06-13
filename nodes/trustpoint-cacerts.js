const https = require('https');

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

                    // Ici on ne parse pas → on retourne le PKCS#7 brut
                    msg.payload = buffer;
                    node.log(`CA certs retrieved (${buffer.length} bytes)`);
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

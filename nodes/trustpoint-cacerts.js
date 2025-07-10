const forge = require('node-forge');

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
            msg.payload = buffer;

            try {
                // Convertir PKCS#7 DER en PEMs
                const p7asn1 = forge.asn1.fromDer(buffer.toString('binary'));
                const p7 = forge.pkcs7.messageFromAsn1(p7asn1);

                const pemCerts = p7.certificates.map(cert => forge.pki.certificateToPem(cert));
                msg.pemCerts = pemCerts;
                msg.pemCertsPreview = pemCerts[0].split('\n').slice(0, 10).join('\n') + '\n...';

                node.log(`CA certs retrieved (${buffer.length} bytes, ${pemCerts.length} certs)`);
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

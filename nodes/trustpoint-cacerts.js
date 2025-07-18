const https = require("https");
const forge = require("node-forge");

module.exports = function (RED) {
  function TrustpointCACertsNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    node.on("input", function (msg, send, done) {
      const estHost = msg.estHost || config.estHost || "https://127.0.0.1/.well-known/est/cacerts";

      const options = {
        method: "GET",
        rejectUnauthorized: false
      };

      https.get(estHost, options, (res) => {
        let chunks = [];

        res.on("data", (chunk) => {
          chunks.push(chunk);
        });

        res.on("end", () => {
          try {
            const raw = Buffer.concat(chunks);
            const rawBinary = raw.toString("binary");

            // Parse DER as ASN.1 (strict mode = false)
            const asn1 = forge.asn1.fromDer(rawBinary, false);
            const p7 = forge.pkcs7.messageFromAsn1(asn1);

            if (!p7.certificates || p7.certificates.length === 0) {
              throw new Error("No certificates found in PKCS#7 message.");
            }

            // Convert all certificates to PEM
            const certsPem = p7.certificates.map(cert => forge.pki.certificateToPem(cert)).join("\n");

            msg.payload = {
              certificate: certsPem,
              deviceId: "ca-cert"
            };

            send(msg);
            if (done) done();
          } catch (err) {
            node.error("❌ Failed to process CA certs: " + err.message, msg);
            if (done) done(err);
          }
        });
      }).on("error", (err) => {
        node.error("❌ Failed to fetch CA certs: " + err.message, msg);
        if (done) done(err);
      });
    });
  }

  RED.nodes.registerType("trustpoint-cacerts", TrustpointCACertsNode);
};

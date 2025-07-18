const https = require("https");
const forge = require("node-forge");

module.exports = function (RED) {
  function TrustpointCACertsNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    node.on("input", (msg, send, done) => {
      const estUrl = msg.estHost || config.estHost || "https://127.0.0.1/.well-known/est/cacerts";

      const options = {
        rejectUnauthorized: false
      };

      https.get(estUrl, options, (res) => {
        const chunks = [];

        res.on("data", (chunk) => chunks.push(chunk));

        res.on("end", () => {
          try {
            const rawBuffer = Buffer.concat(chunks);
            const binary = rawBuffer.toString("binary");

            // Parse DER with strict = false (allow trailing bytes)
            const asn1 = forge.asn1.fromDer(binary, false);
            const pkcs7 = forge.pkcs7.messageFromAsn1(asn1);

            if (!pkcs7.certificates || pkcs7.certificates.length === 0) {
              throw new Error("No certificates found in response.");
            }

            const pemBundle = pkcs7.certificates.map(cert => forge.pki.certificateToPem(cert)).join("\n");

            msg.payload = {
              certificate: pemBundle,
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
        node.error("❌ HTTPS request failed: " + err.message, msg);
        if (done) done(err);
      });
    });
  }

  RED.nodes.registerType("trustpoint-cacerts", TrustpointCACertsNode);
};

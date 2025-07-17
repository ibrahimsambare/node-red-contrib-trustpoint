const https = require("https");
const forge = require("node-forge");

module.exports = function (RED) {
  function TrustpointCACertsNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    node.on("input", function (msg, send, done) {
      const estUrl = msg.estHost || config.estHost || "https://127.0.0.1/.well-known/est/cacerts";

      const options = {
        method: "GET",
        rejectUnauthorized: false,
      };

      https.get(estUrl, options, (res) => {
        const chunks = [];

        res.on("data", (chunk) => {
          chunks.push(chunk);
        });

        res.on("end", () => {
          try {
            const raw = Buffer.concat(chunks);
            const der = raw.toString("binary");

            // Parse as PKCS#7 bundle
            const p7asn1 = forge.asn1.fromDer(der);
            const p7 = forge.pkcs7.messageFromAsn1(p7asn1);

            if (!p7.certificates || p7.certificates.length === 0) {
              throw new Error("No certificates found in PKCS#7 response");
            }

            // Convert each certificate to PEM
            const pemCerts = p7.certificates.map(cert => forge.pki.certificateToPem(cert));

            msg.payload = {
              certificate: pemCerts.join("\n"),
              deviceId: "ca-cert"
            };

            send(msg);
            if (done) done();
          } catch (err) {
            node.error("Failed to process CA certs: " + err.message, msg);
            if (done) done(err);
          }
        });
      }).on("error", (err) => {
        node.error("Failed to fetch CA certs: " + err.message, msg);
        if (done) done(err);
      });
    });
  }

  RED.nodes.registerType("trustpoint-cacerts", TrustpointCACertsNode);
};

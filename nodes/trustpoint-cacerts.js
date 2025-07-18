const fs = require("fs");
const path = require("path");
const https = require("https");

module.exports = function (RED) {
  function TrustpointCACertsNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    node.on("input", function (msg, send, done) {
      const certsDir = path.resolve(__dirname, "../../certs");
      const filePath = path.join(certsDir, "ca-cert.p7b"); // assure-toi que ce fichier existe et contient un certificat PEM valide
      const estUrl = msg.estHost || "https://127.0.0.1/.well-known/est/cacerts";

      try {
        const certData = fs.readFileSync(filePath, "utf8");
      const options = {
        method: "GET",
        rejectUnauthorized: false,
      };

        msg.payload = {
          certificate: certData,
          deviceId: msg.deviceId || "trustpoint-ca"
        };
      https.get(estUrl, options, (res) => {
        let chunks = [];

        send(msg);
        if (done) done();
      } catch (err) {
        node.error("Failed to read CA certificate", err);
        res.on("data", (chunk) => {
          chunks.push(chunk);
        });

        res.on("end", () => {
          const raw = Buffer.concat(chunks);
          const base64 = raw.toString("base64");
          const pem = [
            "-----BEGIN CERTIFICATE-----",
            base64.match(/.{1,64}/g).join("\n"),
            "-----END CERTIFICATE-----"
          ].join("\n");

          msg.payload = pem;
          send(msg);
          if (done) done();
        });
      }).on("error", (err) => {
        node.error("Failed to fetch CA certs: " + err.message, msg);
        if (done) done(err);
      }
      });
    });
  }

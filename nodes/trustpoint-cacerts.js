const fs = require("fs");
const path = require("path");

module.exports = function (RED) {
  function TrustpointCACertsNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    node.on("input", function (msg, send, done) {
      const certsDir = path.resolve(__dirname, "../../certs");
      const filePath = path.join(certsDir, "ca-cert.p7b"); // assure-toi que ce fichier existe et contient un certificat PEM valide

      try {
        const certData = fs.readFileSync(filePath, "utf8");

        msg.payload = {
          certificate: certData,
          deviceId: msg.deviceId || "trustpoint-ca"
        };

        send(msg);
        if (done) done();
      } catch (err) {
        node.error("Failed to read CA certificate", err);
        if (done) done(err);
      }
    });
  }

  RED.nodes.registerType("trustpoint-cacerts", TrustpointCACertsNode);
};

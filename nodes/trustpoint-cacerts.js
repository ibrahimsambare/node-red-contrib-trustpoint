const fs = require("fs");
const path = require("path");

module.exports = function (RED) {
  function TrustpointCACertsNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    node.on("input", function (msg, send, done) {
      const certsDir = path.resolve(__dirname, "../../certs");
      const filePath = path.join(certsDir, "ca-certs.p7b");

      try {
        const raw = fs.readFileSync(filePath, { encoding: "base64" });
        const wrapped = [
          "-----BEGIN CERTIFICATE-----",
          raw.match(/.{1,64}/g).join("\n"),
          "-----END CERTIFICATE-----"
        ].join("\n");

        msg.payload = wrapped;
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

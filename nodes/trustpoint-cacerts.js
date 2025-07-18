const { exec } = require("child_process");
const fs = require("fs");

module.exports = function (RED) {
  function TrustpointCACertsNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    node.on("input", function (msg, send, done) {
      const url = msg.estHost || config.estHost || "https://127.0.0.1:443/.well-known/est/arburg/cacerts/";
      const outputDir = "/tmp";
      const p7bPath = `${outputDir}/cacerts.p7b`;
      const pemPath = `${outputDir}/cacerts.pem`;

      const curlCmd = `curl -k -X GET "${url}" -H "Accept: application/pkcs7-mime" | base64 --decode > ${p7bPath}`;
      const opensslCmd = `openssl pkcs7 -print_certs -inform DER -in ${p7bPath} -out ${pemPath}`;

      exec(curlCmd, (curlErr) => {
        if (curlErr) {
          node.error("❌ Curl failed: " + curlErr.message, msg);
          return done(curlErr);
        }

        exec(opensslCmd, (opensslErr) => {
          if (opensslErr) {
            node.error("❌ OpenSSL failed: " + opensslErr.message, msg);
            return done(opensslErr);
          }

          try {
            const certs = fs.readFileSync(pemPath, "utf8");
            msg.payload = {
              certificate: certs,
              deviceId: "ca-cert"
            };
            send(msg);
            if (done) done();
          } catch (readErr) {
            node.error("❌ Failed to read PEM file: " + readErr.message, msg);
            done(readErr);
          }
        });
      });
    });
  }

  RED.nodes.registerType("trustpoint-cacerts", TrustpointCACertsNode);
};

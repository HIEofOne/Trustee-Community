import crypto from 'crypto';
const domain: string = process.env.DOMAIN !== undefined ? process.env.DOMAIN: '';
const url = new URL(domain);

async function verifySig(req: any) {
  // verify digest
  const digest = <string>req.headers['content-digest'];
  const digest_arr = digest.split("=:");
  const hash = crypto.createHash(digest_arr[0].replace('-', '')).update(JSON.stringify(req.body)).digest('hex');
  if (hash === digest_arr[1]) {
    // verify signature
    const signature = <string>req.headers['signature'];
    var signature_input = <string>req.headers['signature-input'];
    const signature1 = signature.replace('sig1=', '');
    const components = signature_input.substring(signature_input.indexOf("(") +1, signature_input.lastIndexOf(")")).split(' ');
    const url1 = new URL(<string>req.url, `http://${req.headers.host}`)
    const parts = components.map((component) => {
      let value;
      if (component.startsWith('"@')) {
        if (component === '"@method"') {
          value = req.method;
        }
        if (component === '"@target-uri"') {
          value = url.protocol + `//` + url.hostname + url1.pathname;
        }
      } else {
        value = req.headers[component.toLowerCase().replaceAll('"', '')];
      }
      return`${component.toLowerCase()}: ${value}`;
    })
    const sig1 = signature_input.replace('sig1=','')
    parts.push(`"@signature-params": ${sig1}`)
    const data = parts.join('\n');
    const key = req.body.client.key.jwk
    // @ts-ignore
    const verify = crypto.createVerify('sha256').update(data).verify({key: key, format: 'jwk', padding: crypto.RSA_PKCS1_PADDING}, signature1, 'base64');
    if (verify) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
}
export default verifySig;
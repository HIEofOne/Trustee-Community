function parseSig(req: any) {
  const response = {
    created: '',
    keyid: ''
  }
  const signature_input = <string>req.headers['signature-input'];
  const signature_input_arr = signature_input.split(';');
  const created = signature_input_arr.find((input) => {
    if (input.startsWith('created')) {
      return true;
    } else {
      return false;
    }
  })
  const keyid = signature_input_arr.find((input) => {
    if (input.startsWith('keyid')) {
      return true;
    } else {
      return false;
    }
  })
  if (created !== undefined) {
    response.created = created.replace('created=', '');
  }
  if (keyid !== undefined) {
    response.keyid = keyid.replace('keyid', '');
  }
  return response;
}
export default parseSig;
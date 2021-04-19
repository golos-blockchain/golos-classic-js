const snakeCaseRe = /_([a-z])/g;
export function camelCase(str) {
  return str.replace(snakeCaseRe, function(_m, l) {
    return l.toUpperCase();
  });
}

function toFixedTrunc(x, n) {
  const v = (typeof x === 'string' ? x : x.toString()).split('.');
  if (n <= 0) return v[0];
  let f = v[1] || '';
  if (f.length > n) return `${v[0]}.${f.substr(0,n)}`;
  while (f.length < n) f += '0';
  return `${v[0]}.${f}`
}

class _Asset {
  constructor(amount, precision, symbol) {
    if (precision && symbol) {
      this._amount = amount;
      this._precision = precision;
      this._symbol = symbol;
      return;
    }
    const str = amount;
    const asset_parts = str.split(' ');
    this._precision = asset_parts[0].split('.')[1].length;
    this._amount = parseFloat(asset_parts[0]) * Math.pow(10, this._precision);
    this._symbol = asset_parts[1];
  }

  get amount() {
    return this._amount;
  }

  set amount(value) {
    this._amount = value;
  }

  get amountFloat() {
    return this._amount / Math.pow(10, this._precision);
  }

  set amountFloat(value) {
    this._amount = value * Math.pow(10, this._precision);
  }

  get precision() {
    return this._precision;
  }

  set precision(value) {
    this._precision = value;
  }

  get symbol() {
    return this._symbol;
  }

  set symbol(value) {
    this._symbol = value;
  }

  get isUIA() {
    return this._symbol != 'GOLOS' && this._symbol != 'GBG' && this._symbol != 'GESTS';
  }

  toString(decPlaces = undefined) {
    return toFixedTrunc(this.amountFloat, decPlaces !== undefined ? decPlaces : this._precision) + ' ' + this._symbol;
  }
}
export function Asset(...args) {
  return new _Asset(...args);
}

export function validateAccountName(value) {
  let i, label, len, suffix;
  let res = {error: null, msg: ''};

  suffix = "Account name should ";

  if (!value) {
    res.msg = suffix + "not be empty.";
    res.error = 'account_name_should_not_be_empty';
    return res;
  }

  const length = value.length;
  if (length < 3) {
    res.msg = suffix + "be longer.";
    res.error = 'account_name_should_be_longer';
    return res;
  }
  if (length > 16) {
    res.msg = suffix + "be shorter.";
    res.error = 'account_name_should_be_shorter';
    return res;
  }

  if (/\./.test(value)) {
    suffix = "Each account segment should ";
  }
  const ref = value.split(".");
  for (i = 0, len = ref.length; i < len; i++) {
    label = ref[i];
    if (!/^[a-z]/.test(label)) {
      res.msg = suffix + "start with a letter.";
      res.error = 'each_account_segment_should_start_with_a_letter';
      return res;
    }
    if (!/^[a-z0-9-]*$/.test(label)) {
      res.msg = suffix + "have only letters, digits, or dashes.";
      res.error = 'each_account_segment_should_have_only_letters_digits_or_dashes';
      return res;
    }
    if (/--/.test(label)) {
      res.msg = suffix + "have only one dash in a row.";
      res.error = 'each_account_segment_should_have_only_one_dash_in_a_row';
      return res;
    }
    if (!/[a-z0-9]$/.test(label)) {
      res.msg = suffix + "end with a letter or digit.";
      res.error = 'each_account_segment_should_end_with_a_letter_or_digit';
      return res;
    }
    if (!(label.length >= 3)) {
      res.msg = suffix + "be longer";
      res.error = 'each_account_segment_should_be_longer';
      return res;
    }
  }

  return res;
}

export function fitImageToSize(width, height, goodWidth, goodHeight) {
    let overWidth = width / goodWidth;
    let overHeight = height / goodHeight;

    if (overWidth <= 1 && overHeight <= 1) {
        return { width, height };
    }

    let proportion = width / height;

    if (overWidth > overHeight) {
        width = goodWidth;
        height = Math.round(width / proportion);
    } else {
        height = goodHeight;
        width = Math.round(height * proportion);
    }
    return { width, height };
}

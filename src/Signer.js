const fs = require("fs");
const Utils = require("./Utils");
const { JSDOM, ResourceLoader } = require("jsdom");
const { createCipheriv } = require("crypto");

class Signer {
  static DEFAULT_USERAGENT =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.109 Safari/537.36";
  static PASSWORD = "webapp1.0+202106";
  /**
   * @type Window
   */
  window = null;

  constructor(userAgent = Signer.DEFAULT_USERAGENT) {
    const signature_js = fs.readFileSync(__dirname + "/../js/signature.js", "utf-8");
    const webmssdk = fs.readFileSync(__dirname + "/../js/webmssdk.js", "utf-8");
    const resourceLoader = new ResourceLoader({ userAgent });

    const { window } = new JSDOM("", {
      url: "https://www.tiktok.com",
      referrer: "https://www.tiktok.com",
      contentType: "text/html",
      includeNodeLocations: false,
      runScripts: "outside-only",
      pretendToBeVisual: true,
      resources: resourceLoader
    });
    this.window = window;
    this.window.eval(signature_js.toString());
    this.window.byted_acrawler.init({
      aid: 24,
      dfp: true
    });
    this.window.eval(webmssdk);
  }

  navigator() {
    return {
      deviceScaleFactor: this.window.devicePixelRatio,
      user_agent: this.window.navigator.userAgent,
      browser_language: this.window.navigator.language,
      browser_platform: this.window.navigator.platform,
      browser_name: this.window.navigator.appCodeName,
      browser_version: this.window.navigator.appVersion
    };
  }

  signature(url) {
    return this.window.byted_acrawler.sign({ url });
  }

  bogus(params) {
    return this.window._0x32d649(params);
  }

  xttparams(params) {
    params += "&is_encryption=1";
    // Encrypt query string using aes-128-cbc
    const cipher = createCipheriv("aes-128-cbc", Signer.PASSWORD, Signer.PASSWORD);
    return Buffer.concat([cipher.update(params), cipher.final()]).toString("base64");
  }

  sign(url_str) {
    const url = new URL(url_str);
    const verifyFp = Utils.verify_fp();
    url.searchParams.append('verifyFp', verifyFp);
    const signature = this.signature(url.toString());
    url.searchParams.append('_signature', signature);
    const bogus = this.bogus(url.searchParams.toString());
    url.searchParams.append('X-Bogus', bogus);
    const xttparams = this.xttparams(url.searchParams.toString());
    return {
      signature: signature,
      verify_fp: verifyFp,
      signed_url: url.toString(),
      "x-tt-params": xttparams,
      "X-Bogus": bogus
    };
  }
}

module.exports = Signer;

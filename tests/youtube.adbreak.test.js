const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const test = require("node:test");
const { runInNewContext } = require("node:vm");

const root = join(__dirname, "..");
const script = readFileSync(join(root, "Script/Youtube/youtube.adbreak.request.js"), "utf8");
const moduleText = readFileSync(join(root, "YouTube.Enhance.sgmodule"), "utf8");
const api = "https://youtubei.googleapis.com/youtubei/v1";
const alternate = "https://youtubei-att.googleapis.com/youtubei/v1";
const adBreak = api + "/player/ad_break";
const alternateAdBreak = alternate + "/player/ad_break?foo=1";

const otherUrls = [
  api + "/player",
  api + "/browse",
  api + "/next",
  api + "/search",
  api + "/log_event",
  adBreak + "/extra",
  adBreak + "#fragment",
  adBreak.replace(".com/", ".com.example/"),
  adBreak.replace("https:", "http:"),
  "https://video.googlevideo.com/initplayback?foo=1&ack=1"
];

function run(request, argument) {
  const calls = [];
  const logs = [];
  runInNewContext(script, {
    $request: request,
    $argument: argument,
    $done: (result) => calls.push(result),
    console: { log: (message) => logs.push(message) }
  });
  assert.equal(calls.length, 1, "$done must be called exactly once");
  return { result: calls[0], logs };
}

function assertEmptyProtobuf(result) {
  const { response } = result;
  assert.equal(response.status, 200);
  assert.deepEqual({ ...response.headers }, {
    "Content-Type": "application/x-protobuf",
    "Cache-Control": "no-store"
  });
  assert.equal(Object.prototype.toString.call(response.body), "[object Uint8Array]");
  assert.equal(response.body.byteLength, 0);
}

test("serves empty Protobuf for POSTs to either ad_break host", () => {
  const cases = [
    [adBreak, undefined],
    [alternateAdBreak, '{"blockAdBreak":true,"debug":false}'],
    [adBreak, '{"blockAdBreak":"true"}']
  ];
  for (const [url, argument] of cases) {
    const { result, logs } = run({ url, method: "POST" }, argument);
    assertEmptyProtobuf(result);
    assert.deepEqual(logs, []);
  }
});

test("passes through other URLs, methods and missing requests", () => {
  for (const url of otherUrls) {
    assert.deepEqual({ ...run({ url, method: "POST" }).result }, {}, url);
  }
  assert.deepEqual({ ...run({ url: adBreak, method: "GET" }).result }, {});
  assert.deepEqual({ ...run().result }, {});
});

test("passes through disabled and invalid options without logging their contents", () => {
  for (const argument of ['{"blockAdBreak":false}', '{"blockAdBreak":"false"}',
    '{"blockAdBreak":"invalid"}', '{"blockAdBreak":null}', 'null', '[]', 'invalid synthetic token']) {
    const { result, logs } = run({ url: adBreak, method: "POST" }, argument);
    assert.deepEqual({ ...result }, {}, argument);
    assert.deepEqual(logs, []);
  }
});

test("debug output contains only a generic event", () => {
  const request = {
    url: adBreak + "?token=synthetic",
    method: "POST",
    get headers() { throw new Error("headers must not be read"); },
    get body() { throw new Error("body must not be read"); }
  };
  const { result, logs } = run(request, '{"debug":true}');
  assertEmptyProtobuf(result);
  assert.deepEqual(logs, ["[YouTube AdBreak] Returning empty Protobuf"]);
});

test("the module matches only ad_break and expands the default and disabled arguments", () => {
  const rule = moduleText.match(/^youtube\.request\.adbreak = (.+)$/m)[1];
  const pattern = new RegExp(rule.match(/,pattern=([^,]+)/)[1]);
  assert.match(rule, /type=http-request,.*requires-body=0,binary-body-mode=1,/);
  assert.match(adBreak, pattern);
  assert.match(alternateAdBreak, pattern);
  for (const url of otherUrls) {
    assert.doesNotMatch(url, pattern);
  }

  const args = Object.fromEntries(moduleText.match(/^#!arguments=(.+)$/m)[1]
    .split(",").map((entry) => entry.split(":")));
  assert.deepEqual(args, {
    "屏蔽上传按钮": "true",
    "屏蔽选段按钮": "true",
    "屏蔽Shorts按钮": "false",
    "字幕翻译语言": "off",
    "启用调试模式": "false",
    block_ad_break: "true"
  });
  const argumentTemplate = rule.match(/,argument="(.+)"$/)[1];
  const expand = (values) => argumentTemplate.replace(/\{\{\{([^{}]+)\}\}\}/g,
    (_, key) => values[key]);
  const request = { url: adBreak, method: "POST" };
  assertEmptyProtobuf(run(request, expand(args)).result);
  assert.deepEqual({ ...run(request, expand({ ...args, block_ad_break: "false" })).result }, {});
});

test("all script paths resolve within the fork branch and both hosts are in MITM", () => {
  const branchBase = "https://raw.githubusercontent.com/jerry74/sgmodule/fix/youtube-ad-break/";
  const paths = [...moduleText.matchAll(/script-path=([^,\s]+)/g)].map((match) => match[1]);
  assert.equal(paths.length, 4);
  for (const url of paths) {
    assert.ok(url.startsWith(branchBase), url);
    assert.doesNotThrow(() => readFileSync(join(root, url.slice(branchBase.length))), url);
  }

  const hosts = moduleText.match(/^hostname = %APPEND% (.+)$/m)[1].split(", ");
  assert.deepEqual(hosts, ["*.googlevideo.com", new URL(api).hostname, new URL(alternate).hostname]);

  const oldResponse = moduleText.match(/^youtube\.response = .+?,pattern=([^,]+)/m)[1];
  assert.doesNotMatch(adBreak, new RegExp(oldResponse));
});

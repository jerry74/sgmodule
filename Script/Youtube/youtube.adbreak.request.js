// Handle YouTube ad_break requests in Surge without reading the request body.
(() => {
  function handleRequest() {
    const endpoint = /^https:\/\/youtubei(?:-att)?\.googleapis\.com\/youtubei\/v1\/player\/ad_break(?:\?[^#]*)?$/;
    if (typeof $request === "undefined" || !$request ||
        $request.method !== "POST" || !endpoint.test($request.url)) {
      return {};
    }

    const options = typeof $argument === "undefined" || $argument === ""
      ? {}
      : JSON.parse($argument);
    if (!options || typeof options !== "object" || Array.isArray(options)) {
      return {};
    }
    const { blockAdBreak: enabled = true } = options;
    if (enabled !== true && enabled !== "true") {
      return {};
    }

    if (options.debug === true || options.debug === "true") {
      console.log("[YouTube AdBreak] Returning empty Protobuf");
    }
    return {
      response: {
        status: 200,
        headers: {
          "Content-Type": "application/x-protobuf",
          "Cache-Control": "no-store"
        },
        body: new Uint8Array(0)
      }
    };
  }

  let result;
  try {
    result = handleRequest();
  } catch {
    result = {};
  }
  $done(result);
})();

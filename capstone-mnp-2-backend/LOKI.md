### AI payload built

```js
req.log.info(
  {
    req_id: req.req_id,
    route: req.originalUrl,
    method: req.method,
    file: "core.js",
    event: "ai.payload.built",
    step: "bk-core: aiPayload",
    ctx: {
      aiPayload, // consider sanitizing if it’s large
    },
  },
  "AI payload built",
)
```

### AI response success

```js
req.log.info(
  {
    req_id: req.req_id,
    route: req.originalUrl,
    method: req.method,
    file: "core.js",
    event: "ai.suggestions.success",
    step: "bk-core: getAiSuggestions success",
    ctx: {
      // log summary instead of full response if it’s huge
      count: Array.isArray(aiResponse) ? aiResponse.length : undefined,
    },
  },
  "AI suggestions received",
)
```

```js
if (process.env.LOG_AI_RESPONSE === "true") {
  req.log.debug(
    { req_id: req.req_id, event: "ai.suggestions.raw", ctx: { aiResponse } },
    "AI response (raw)",
  )
}
```

### URL used

```js
req.log.info(
  {
    req_id: req.req_id,
    route: req.originalUrl,
    method: req.method,
    file: "core.js",
    event: "ai.read.url",
    step: "bk-core: AI_READ_URL",
    ctx: {
      url: AI_READ_URL,
    },
  },
  "AI read URL set",
)
```

### Error caught

```js
req.log.error(
  {
    req_id: req.req_id,
    route: req.originalUrl,
    method: req.method,
    file: "core.js",
    event: "ai.suggestions.error",
    step: "bk-core: getAiSuggestions error",
    err, // <-- important
  },
  "AI suggestions failed",
)
```

### req.body

```js
const REQ_ID = req.req_id

const bodySummary = {
  moods: req.body?.moods,
  len_bkt: req.body?.len_bkt,
  zip: req.body?.zip,
  // include only what you care about
}

req.log.info(
  { req_id: REQ_ID, event: "request.body", ctx: { body: bodySummary } },
  "Request body received",
)
```

#### Full req.body

```js
if (process.env.LOG_BODIES === "true") {
  req.log.debug(
    { req_id: REQ_ID, event: "request.body.raw", ctx: { body: req.body } },
    "Request body (raw)",
  )
}
```

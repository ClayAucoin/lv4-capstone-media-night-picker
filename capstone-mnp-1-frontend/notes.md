## Todo

- add a random picker for the weather, mood and length

- validate input
- send api-key to backend
- CHECK APPS
  - Backend
- why is this url showing in the browser console for every submition?
  - https://api.themoviedb.org/3/movie/560824/images?include_image_language=en,null
- land errors softly for users

- Design decisions to fix
  - Services are split by responsibility (frontend, API, weather, AI) to mirror real-world architectures
  - Query signatures are generated deterministically to prevent duplicate recommendation sets
  - Error handling favors explicit logging over silent failure
  - Minimal authentication was chosen to keep focus on data flow and validation
  - UI prioritizes clarity and debuggability over visual polish

- Items to check for "troubleshooting"
  - **Empty results page**
    - Usually means the Display route was loaded directly without submitting the form
  - **Weather lookup fails**
    - Verify ZIP code format and weather API key
  - **AI service returns malformed JSON**
    - The AI service includes defensive parsing, but malformed responses may still throw errors
  - **Duplicate recommendation sets**
    - Check the generated `query_signature` in Supabase to confirm normalization behavior

- Known Limitations
  - This project is optimized for learning and demonstration, not production scale
  - Authentication and authorization are not hardened
  - API rate limiting is not enforced
  - AI output quality depends on prompt tuning and model behavior
  - No background job or caching layer exists for expensive operations

### Stacks

| Stack Type                | PM2 Name      | Local Port | Server Port | External URL                                             |
| ------------------------- | ------------- | :--------: | :---------: | -------------------------------------------------------- |
| React                     | frontend-mnp  |    5173    |    3080     | [mnp.clayaucoin.foo](https://mnp.clayaucoin.foo)         |
| Express.js                | backend-api   |    3000    |    3000     | [api.clayaucoin.foo](https://api.clayaucoin.foo)         |
| Express.js (microservice) | ms-wx-weather |    3100    |    3100     | [weather.clayaucoin.foo](https://weather.clayaucoin.foo) |
| Express.js (microservice) | ms-ai-lv4.ai  |    3105    |    3105     | [lv4.ai.clayaucoin.foo](https://lv4.ai.clayaucoin.foo)   |
| Loki                      |               |    3110    |    3110     | [192.168.1.129:3110](http://192.168.1.129:3110)          |
| Grafana                   |               |    3001    |    3001     | [192.168.1.129:3001](http://192.168.1.129:3001)          |

### Grafana

```httpnnnnn
http://192.168.1.129:3001/explore
```

```js
{service=~".+"} |= "2e28b5e3-2caf-42eb-bb83-44a00bf8dc4a"

{service=~".+"} |= "bk-core getWxCondition success"

{service=~".+"} | json | level=30 or level=50
```

### INSERT new set

<!--

- length_bucket: ["LT_90","B90_120","B120_150","GT_150"]
- weather_bucket: ["CLEAR","RAIN","COLD","HOT","STORM"]
- moods: ["chill","funny","intense","romantic","family","uplifting","mystery","action"]

-->

```js
const payload = {
  moods,
  length_bucket,
  weather_bucket,
  prompt_version,
  variant,
}

const { data, error } = await supabase
  .from("lv4_cap_recommendation_sets")
  .insert(payload)
  .select("id, query_signature")
  .single()
```

### Get-or-create

```js
const payload = {
  moods,
  length_bucket,
  weather_bucket,
  prompt_version,
  variant,
}

const { data, error } = await supabase
  .from("lv4_cap_recommendation_sets")
  .upsert(payload, { onConflict: "query_signature" })
  .select("id, query_signature")
  .single()
```

### UPSERT query

```js
const payload = {
  moods,
  length_bucket,
  weather_bucket,
  prompt_version,
  variant,
}

const { data, error } = await supabase
  .from("lv4_cap_recommendation_sets")
  .upsert(payload, { onConflict: "query_signature" })
  .select("id, query_signature")
  .single()
```

### INSERT

```sql
insert into public.lv4_cap_recommendation_sets (
  moods, length_bucket, weather_bucket, prompt_version, variant
)
values (
  ARRAY['funny','chill']::text[],
  'LT_90',
  'RAIN',
  'v1',
  'default'
)
returning id, query_signature;
```

### UPDATE

```sql
update public.lv4_cap_recommendation_sets
set moods = ARRAY['chill','funny','mystery']::text[]
where id = '...'
returning query_signature;
```

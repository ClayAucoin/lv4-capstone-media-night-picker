## Todo

- validate input

- Loading...

  - Have a loading spinner and dim background while loading

- Add results to Supabase

  - how does adding multiple rows to Supabase work

- Check if signature exists before hitting AI

### Stacks

| Stacks    | Port | External URL           |
| --------- | ---- | ---------------------- |
| frontend  | 3080 | mnp.clayaucoin.foo     |
| backend   | 3000 | api.clayaucoin.foo     |
| lv4cap.ai | 3105 | lv4.ai.clayaucoin.foo  |
| weather   | 3100 | weather.clayaucoin.foo |

api9 > mnp

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

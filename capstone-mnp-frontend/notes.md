### INSERT new set

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

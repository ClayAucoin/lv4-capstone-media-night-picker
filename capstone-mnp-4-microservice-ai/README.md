### Access URLs

[AI microservice](https://lv4.ai.clayaucoin.foo/api/v1/ai?t=true)

http://localhost:3105/api/v1/ai?t=true

Query variable:

```http
t (testing): bool
```

Headers:

```bash
x-api-key
```

Body:

```json
{
  "count": 5,
  "len_bkt": "B120_150",
  "wx_bkt": "COLD",
  "moods": ["chill", "romantic"]
}
```

# AI Cost Estimate (Amazon Bedrock)

_Estimated 2026-10-16. Month-to-date AI spend so far: **$2.15** (development and testing)._

## Summary

- **Resume rewrite:** about 3–7¢ each
- **Cover letter:** about 1¢ each
- **Full bundle per user** (resume upload/parse, one rewrite, one cover letter, a few light actions): about 7–15¢

| Volume | Resume rewrites | Cover letters | Full bundle per user |
|---|---|---|---|
| 1 | $0.03–0.07 | ~$0.01 | $0.07–0.15 |
| 100 | $3–7 | ~$1 | $7–15 |
| 500 | $15–35 | ~$4–8 | $35–75 |
| 1,000 | $30–70 | ~$8–16 | $70–150 |

The low end is a normal run. The high end allows for retries, the occasional Kimi loop (cut off at 40s and retried), and the page-fit pass running a second writer call.

## Prices used

The app deploys to Tokyo (`hnd1`), so these are Tokyo-region prices.

| Model | Role | Input / 1M tokens | Output / 1M tokens |
|---|---|---|---|
| DeepSeek V3.2 | Reviewer (fact-check) | $0.74 | $2.22 |
| Kimi K2.5 | Writer and parser | ~$0.72 (estimate) | ~$3.60 (estimate) |

I couldn't find Bedrock's Kimi K2.5 price. The estimate takes the third-party price (~$0.60 in / $3.00 out) and adds the same Tokyo markup DeepSeek has. Kimi output tokens make up most of the cost.

## Cost per feature

| Feature | Calls | Approx. tokens | Approx. cost |
|---|---|---|---|
| Resume rewrite (optimize / improve / workspace) | Kimi writer | 6k in / 3k out | ~1.5¢ |
| | DeepSeek reviewer | 8k in / 1k out | ~0.8¢ |
| | Kimi line fixes | 3k in / 1k out | ~0.6¢ |
| | **Total** | | **~3¢ (up to ~7¢)** |
| Resume parse (upload) | Kimi | 3k in / 4k out | ~1.7¢ |
| Cover letter | Kimi | 3k in / 1k out | ~0.6–1¢ |
| Light actions (analyzer, tailor, enhance) | Kimi | small | ~0.5¢ each |

## How this was estimated

- Token sizes are worked out from the prompt sizes and `max_tokens` limits in the code, not from billed usage.
- `ai_usage_events` has only 2 rows so far (both from 2026-10-14). It also records tokens only for the main call, not for the reviewer or fix calls.
- Sanity check: $2.15 works out to roughly 50–70 test rewrites with retries, which fits a few days of testing.

## Limits of this estimate

- The Kimi K2.5 Bedrock price is an estimate. Check the Kimi line in the AWS bill.
- If Kimi produces reasoning tokens, the real cost moves toward the high end.
- This covers AI only. Vercel and Supabase are separate monthly costs that don't grow with the number of resumes.
- To get exact per-feature costs, the quality gate's reviewer and fix calls should record their tokens in `ai_usage_events`.

## Sources

- [Amazon Bedrock pricing](https://aws.amazon.com/bedrock/pricing/)
- [Bedrock vs DeepInfra price comparison](https://pricepertoken.com/endpoints/compare/amazon-bedrock-vs-deepinfra)

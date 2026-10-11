# Implementation plan

1. Extract the existing region/topic conjunction into one reusable relevance helper.
2. Add two fixed-query Google News RSS requests and an escaped private HTML reader with feed health/date labels.
3. Inject discovery only from the production CLI, persist under evidence prefixes, and keep it outside inference/public bundle construction. Test injection avoids live requests in unit tests.
4. Align October 10 title dates with October 11/generated editions.
5. Validate locally/live, review staged privacy/outgoing changes, merge passing CI, deploy immutable runtime and verify private cloud output and schedule.

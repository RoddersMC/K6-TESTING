import http from 'k6/http';
import { group, check } from 'k6';
import { Rate as k6mr, Trend as k6mt } from 'k6/metrics';

export function frontPageSteps(checkFailureRate: k6mr, timeToFirstByte: k6mt) {
    group("Front page", function() {
        let res = null;
        // As mentioned above, this logic just forces the performance alert for too many urls, use env URL_ALERT to force it
        // It also highlights the ability to programmatically do things right in your script
        if (__ENV.URL_ALERT) {
            res = http.get("http://test.k6.io/?ts=" + Math.round(randomIntBetween(1,2000)));
        } else {
            res = http.get("http://test.k6.io/?ts=" + Math.round(randomIntBetween(1,2000)), { tags: { name: "http://test.k6.io/ Aggregated"}});
        }
        let checkRes = check(res, {
            "Homepage body size is 11026 bytes": (r) => r.body.length === 11026,
            "Homepage welcome header present": (r) => r.body.indexOf("Welcome to the k6.io demo site!") !== -1
        });

        // Record check failures
        checkFailureRate.add(!checkRes);

        // Record time to first byte and tag it with the URL to be able to filter the results in Insights
        timeToFirstByte.add(res.timings.waiting, { ttfbURL: res.url });

        // Load static assets
        group("Static assets", function() {
            let res = http.batch([
                ["GET", "http://test.k6.io/static/css/site.css", {}, { tags: { staticAsset: "yes" } }],
                ["GET", "http://test.k6.io/static/js/prisms.js", {}, { tags: { staticAsset: "yes" } }]
            ]);
            checkRes = check(res[0], {
                "Is stylesheet 4859 bytes?": (r) => r.body.length === 4859,
            });

            // Record check failures
            checkFailureRate.add(!checkRes);

            // Record time to first byte and tag it with the URL to be able to filter the results in Insights
            timeToFirstByte.add(res[0].timings.waiting, { ttfbURL: res[0].url, staticAsset: "yes" });
            timeToFirstByte.add(res[1].timings.waiting, { ttfbURL: res[1].url, staticAsset: "yes" });
        });

    });
}

function randomIntBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}  
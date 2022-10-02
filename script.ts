import { frontPageTest } from "./front-page-steps.ts";
import { loginTest } from "./login-steps.ts";
import { sleep } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

export const options = {
  stages: [
    { duration: '30s', target: 20 }, //simulate a ramp-up to 20 users over 30s 
    { duration: '1m30s', target: 10 }, //simulate a ramp-down to 10 users over 1m 40s
    { duration: '20s', target: 0 }, //simulate a ramp-down to 0 users over 20s
  ],
  thresholds: {
    "http_req_duration": ["p(95)<500"],
    "http_req_duration{staticAsset:yes}": ["p(95)<100"],
    "check_failure_rate": ["rate<0.3"]
  }
}

let successfulLogins = new Counter("successful_logins");
let checkFailureRate = new Rate("check_failure_rate");
let timeToFirstByte = new Trend("time_to_first_byte", true);

export default function () {
  frontPageTest(checkFailureRate, timeToFirstByte);
  sleep(10);
  loginTest(successfulLogins, checkFailureRate, timeToFirstByte);
}
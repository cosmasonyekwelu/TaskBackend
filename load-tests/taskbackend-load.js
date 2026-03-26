import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 100,
  duration: "1m",
  thresholds: {
    http_req_failed: ["rate<0.02"],
    http_req_duration: ["p(95)<500"]
  }
};

const baseUrl = __ENV.BASE_URL || "http://localhost:3000";

export default function () {
  const timestamp = `${Date.now()}-${__VU}-${__ITER}`;
  const email = `load-${timestamp}@example.com`;
  const password = "StrongPass#2026";

  const registerRes = http.post(
    `${baseUrl}/api/auth/register`,
    JSON.stringify({ name: "Load User", email, password }),
    { headers: { "Content-Type": "application/json" } }
  );

  check(registerRes, {
    "register status is 201 or 409": (r) => [201, 409].includes(r.status)
  });

  const loginRes = http.post(
    `${baseUrl}/api/auth/login`,
    JSON.stringify({ email, password }),
    { headers: { "Content-Type": "application/json" } }
  );

  check(loginRes, {
    "login status is 200": (r) => r.status === 200
  });

  const token = loginRes.json("data.accessToken");
  if (token) {
    const authHeaders = {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    };

    const createRes = http.post(
      `${baseUrl}/api/products`,
      JSON.stringify({ title: `Product ${timestamp}`, price: 99.99, stock: 5, description: "Load test item" }),
      authHeaders
    );

    check(createRes, {
      "create product status is 201": (r) => r.status === 201
    });

    http.get(`${baseUrl}/api/products?page=1&limit=10&search=Product&sort=createdAt_desc`);
  }

  sleep(1);
}

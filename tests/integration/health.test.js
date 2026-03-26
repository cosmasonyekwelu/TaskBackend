const request = require("supertest");
const createApp = require("../../src/app");

describe("Health and observability endpoints", () => {
  const app = createApp();

  test("GET /health returns 200", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("success");
  });

  test("GET /metrics returns Prometheus payload", async () => {
    const response = await request(app).get("/metrics");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("success");
    expect(response.body.data).toHaveProperty("requestsTotal");
  });
});

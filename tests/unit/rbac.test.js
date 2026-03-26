const { requireRole } = require("../../src/middleware/rbac");

describe("RBAC middleware", () => {
  test("allows request when user has role", () => {
    const middleware = requireRole("admin");
    const req = { user: { role: "admin" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test("denies request when role is missing", () => {
    const middleware = requireRole("admin");
    const req = { user: { role: "user" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });
});

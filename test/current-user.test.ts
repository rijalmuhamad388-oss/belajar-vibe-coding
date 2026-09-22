import { describe, expect, it, mock } from "bun:test";
import { Elysia } from "elysia";

const mockSelect = mock();

mock.module("../src/db", () => ({
  db: {
    select: mockSelect,
  },
}));

const { getCurrentUser } = await import("../src/services/users-services");
const { usersRoute } = await import("../src/routes/users-route");

describe("Feature: Get Current User (GET /api/users/current)", () => {
  describe("Service: getCurrentUser", () => {
    it("should return user data without password when token is valid", async () => {
      const mockUserData = {
        id: 1,
        name: "rijal",
        email: "rijal@localhost",
        createdAt: new Date("2026-01-01T00:00:00Z"),
      };

      mockSelect.mockReturnValueOnce({
        from: () => ({
          innerJoin: () => ({
            where: () => ({
              limit: async () => [mockUserData],
            }),
          }),
        }),
      });

      const user = await getCurrentUser("valid-session-token");
      expect(user).toEqual(mockUserData);
      expect((user as any).password).toBeUndefined();
    });

    it("should throw error 'Unauthorized' when token is not found", async () => {
      mockSelect.mockReturnValueOnce({
        from: () => ({
          innerJoin: () => ({
            where: () => ({
              limit: async () => [],
            }),
          }),
        }),
      });

      await expect(getCurrentUser("invalid-token")).rejects.toThrow("Unauthorized");
    });
  });

  describe("API Route: GET /api/users/current", () => {
    const app = new Elysia().use(usersRoute);

    it("should return HTTP 200 with user data when Authorization Bearer token is valid", async () => {
      const mockUserData = {
        id: 1,
        name: "rijal",
        email: "rijal@localhost",
        createdAt: "2026-01-01T00:00:00.000Z",
      };

      mockSelect.mockReturnValueOnce({
        from: () => ({
          innerJoin: () => ({
            where: () => ({
              limit: async () => [mockUserData],
            }),
          }),
        }),
      });

      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
          headers: {
            Authorization: "Bearer valid-token-123",
          },
        })
      );

      expect(response.status).toBe(200);
      const json = (await response.json()) as any;
      expect(json).toEqual({ data: mockUserData });
    });

    it("should return HTTP 401 when Authorization header is missing", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
        })
      );

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json).toEqual({ error: "Unauthorized" });
    });

    it("should return HTTP 401 when Authorization header does not start with Bearer", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
          headers: {
            Authorization: "Basic dXNlcjpwYXNz",
          },
        })
      );

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json).toEqual({ error: "Unauthorized" });
    });

    it("should return HTTP 401 when Bearer token is empty", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
          headers: {
            Authorization: "Bearer   ",
          },
        })
      );

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json).toEqual({ error: "Unauthorized" });
    });

    it("should return HTTP 401 when token is not found in database", async () => {
      mockSelect.mockReturnValueOnce({
        from: () => ({
          innerJoin: () => ({
            where: () => ({
              limit: async () => [],
            }),
          }),
        }),
      });

      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
          headers: {
            Authorization: "Bearer invalid-or-expired-token",
          },
        })
      );

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json).toEqual({ error: "Unauthorized" });
    });
  });
});

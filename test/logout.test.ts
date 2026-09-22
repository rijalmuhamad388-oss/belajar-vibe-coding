import { describe, expect, it, mock } from "bun:test";
import { Elysia } from "elysia";

const mockSelect = mock();
const mockDelete = mock();

mock.module("../src/db", () => ({
  db: {
    select: mockSelect,
    delete: mockDelete,
  },
}));

const { logoutUser } = await import("../src/services/users-services");
const { usersRoute } = await import("../src/routes/users-route");

describe("Feature: Logout User (DELETE /api/users/logout)", () => {
  describe("Service: logoutUser", () => {
    it("should delete session and return { data: 'OK' } when token exists", async () => {
      const mockWhere = mock(async () => [{ affectedRows: 1 }]);
      mockDelete.mockReturnValueOnce({
        where: mockWhere,
      });

      const result = await logoutUser("valid-token");
      expect(result).toEqual({ data: "OK" });
      expect(mockDelete).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalled();
    });

    it("should throw error 'Unauthorized' when token is not found", async () => {
      const mockWhere = mock(async () => [{ affectedRows: 0 }]);
      mockDelete.mockReturnValueOnce({
        where: mockWhere,
      });

      await expect(logoutUser("invalid-token")).rejects.toThrow("Unauthorized");
    });
  });

  describe("API Route: DELETE /api/users/logout", () => {
    const app = new Elysia().use(usersRoute);

    it("should return HTTP 200 and { data: 'OK' } when Authorization Bearer token is valid", async () => {
      mockDelete.mockReturnValueOnce({
        where: mock(async () => [{ affectedRows: 1 }]),
      });

      const response = await app.handle(
        new Request("http://localhost/api/users/logout", {
          method: "DELETE",
          headers: {
            Authorization: "Bearer valid-token-123",
          },
        })
      );

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toEqual({ data: "OK" });
    });

    it("should return HTTP 401 when Authorization header is missing", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/logout", {
          method: "DELETE",
        })
      );

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json).toEqual({ error: "Unauthorized" });
    });

    it("should return HTTP 401 when Authorization header does not start with Bearer", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/logout", {
          method: "DELETE",
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
        new Request("http://localhost/api/users/logout", {
          method: "DELETE",
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
      mockDelete.mockReturnValueOnce({
        where: mock(async () => [{ affectedRows: 0 }]),
      });

      const response = await app.handle(
        new Request("http://localhost/api/users/logout", {
          method: "DELETE",
          headers: {
            Authorization: "Bearer not-found-token",
          },
        })
      );

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json).toEqual({ error: "Unauthorized" });
    });
  });
});

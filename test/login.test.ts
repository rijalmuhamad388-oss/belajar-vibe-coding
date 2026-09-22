import { describe, expect, it, mock } from "bun:test";
import { Elysia } from "elysia";

const mockSelect = mock();
const mockInsert = mock();

mock.module("../src/db", () => ({
  db: {
    select: mockSelect,
    insert: mockInsert,
  },
}));

const { loginUser } = await import("../src/services/users-services");
const { usersRoute } = await import("../src/routes/users-route");

describe("Feature: Login User & Session Management", () => {
  describe("Service: loginUser", () => {
    it("should throw error 'Email atau password salah' if user not found", async () => {
      mockSelect.mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: async () => [],
          }),
        }),
      });

      await expect(
        loginUser({
          email: "notfound@example.com",
          password: "password123",
        })
      ).rejects.toThrow("Email atau password salah");
    });

    it("should throw error 'Email atau password salah' if password does not match", async () => {
      const hashedPassword = await Bun.password.hash("correctPassword", {
        algorithm: "bcrypt",
        cost: 10,
      });

      mockSelect.mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: async () => [
              {
                id: 1,
                email: "user@example.com",
                password: hashedPassword,
              },
            ],
          }),
        }),
      });

      await expect(
        loginUser({
          email: "user@example.com",
          password: "wrongPassword",
        })
      ).rejects.toThrow("Email atau password salah");
    });

    it("should generate session token and return it if credentials are valid", async () => {
      const hashedPassword = await Bun.password.hash("correctPassword", {
        algorithm: "bcrypt",
        cost: 10,
      });

      mockSelect.mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: async () => [
              {
                id: 42,
                email: "user@example.com",
                password: hashedPassword,
              },
            ],
          }),
        }),
      });

      let insertedSession: any = null;
      mockInsert.mockReturnValueOnce({
        values: async (vals: any) => {
          insertedSession = vals;
          return vals;
        },
      });

      const token = await loginUser({
        email: "user@example.com",
        password: "correctPassword",
      });

      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(10);
      expect(insertedSession).toBeDefined();
      expect(insertedSession.userId).toBe(42);
      expect(insertedSession.token).toBe(token);
    });
  });

  describe("API Route: POST /api/users/login", () => {
    const app = new Elysia().use(usersRoute);

    it("should return HTTP 200 and { data: token } on successful login", async () => {
      const hashedPassword = await Bun.password.hash("rahasia", {
        algorithm: "bcrypt",
        cost: 10,
      });

      mockSelect.mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: async () => [
              {
                id: 1,
                email: "rijal@lokalhost",
                password: hashedPassword,
              },
            ],
          }),
        }),
      });

      mockInsert.mockReturnValueOnce({
        values: async (vals: any) => vals,
      });

      const response = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "rijal@lokalhost",
            password: "rahasia",
          }),
        })
      );

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.data).toBeDefined();
      expect(typeof json.data).toBe("string");
    });

    it("should return HTTP 400 and { error: 'Email atau password salah' } on invalid credentials", async () => {
      mockSelect.mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: async () => [],
          }),
        }),
      });

      const response = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "rijal@lokalhost",
            password: "salah",
          }),
        })
      );

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toEqual({ error: "Email atau password salah" });
    });

    it("should return HTTP 422 if required fields are missing", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "rijal@lokalhost",
            // missing password
          }),
        })
      );

      expect(response.status).toBe(422);
    });
  });
});

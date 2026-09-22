import { describe, expect, it, mock } from "bun:test";
import { Elysia } from "elysia";

// 1. Test Service Logic directly with mocked DB
const mockSelect = mock();
const mockInsert = mock();

mock.module("../src/db", () => ({
  db: {
    select: mockSelect,
    insert: mockInsert,
  },
}));

const { registerUser } = await import("../src/services/users-services");
const { usersRoute } = await import("../src/routes/users-route");

describe("Feature: Registrasi User", () => {
  describe("Service: registerUser", () => {
    it("should throw error 'Email sudah terdaftar' when user already exists", async () => {
      mockSelect.mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: async () => [{ id: 1, email: "exists@example.com" }],
          }),
        }),
      });

      await expect(
        registerUser({
          name: "Existing",
          email: "exists@example.com",
          password: "secret",
        })
      ).rejects.toThrow("Email sudah terdaftar");
    });

    it("should hash password with bcrypt and insert new user when email is available", async () => {
      mockSelect.mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: async () => [],
          }),
        }),
      });

      let insertedValues: any = null;
      mockInsert.mockReturnValueOnce({
        values: async (vals: any) => {
          insertedValues = vals;
          return vals;
        },
      });

      const result = await registerUser({
        name: "New User",
        email: "new@example.com",
        password: "plainPassword123",
      });

      expect(result).toEqual({ data: "OK" });
      expect(insertedValues).toBeDefined();
      expect(insertedValues.name).toBe("New User");
      expect(insertedValues.email).toBe("new@example.com");
      expect(insertedValues.password).not.toBe("plainPassword123");

      const isMatch = await Bun.password.verify("plainPassword123", insertedValues.password);
      expect(isMatch).toBe(true);
    });
  });

  describe("API Route: POST /api/register", () => {
    const app = new Elysia().use(usersRoute);

    it("should register successfully and return { data: 'OK' } with HTTP 200", async () => {
      mockSelect.mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: async () => [],
          }),
        }),
      });

      mockInsert.mockReturnValueOnce({
        values: async (vals: any) => vals,
      });

      const response = await app.handle(
        new Request("http://localhost/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Rijal",
            email: "rijal@lokalhost",
            password: "rahasia",
          }),
        })
      );

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toEqual({ data: "OK" });
    });

    it("should return HTTP 400 and { error: 'Email sudah terdaftar' } when email is duplicate", async () => {
      mockSelect.mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: async () => [{ id: 1, email: "rijal@lokalhost" }],
          }),
        }),
      });

      const response = await app.handle(
        new Request("http://localhost/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Rijal",
            email: "rijal@lokalhost",
            password: "rahasia",
          }),
        })
      );

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toEqual({ error: "Email sudah terdaftar" });
    });

    it("should return HTTP 422 if required fields are missing", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Rijal",
            // missing email and password
          }),
        })
      );

      expect(response.status).toBe(422);
    });
  });
});

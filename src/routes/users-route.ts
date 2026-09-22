import { Elysia, t } from "elysia";
import { registerUser, loginUser, getCurrentUser } from "../services/users-services";

export const usersRoute = new Elysia()
  .post(
    "/api/register",
    async ({ body, set }) => {
      try {
        await registerUser(body);
        return { data: "OK" };
      } catch (error: any) {
        if (
          error?.message === "Email sudah terdaftar" ||
          error?.code === "ER_DUP_ENTRY" ||
          error?.message?.includes("Duplicate entry")
        ) {
          set.status = 400;
          return { error: "Email sudah terdaftar" };
        }
        set.status = 500;
        return { error: error?.message || "Internal Server Error" };
      }
    },
    {
      body: t.Object({
        name: t.String(),
        email: t.String(),
        password: t.String(),
      }),
    }
  )
  .post(
    "/api/users/login",
    async ({ body, set }) => {
      try {
        const token = await loginUser(body);
        return { data: token };
      } catch (error: any) {
        if (error?.message === "Email atau password salah") {
          set.status = 400;
          return { error: "Email atau password salah" };
        }
        set.status = 500;
        return { error: error?.message || "Internal Server Error" };
      }
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
      }),
    }
  )
  .get("/api/users/current", async ({ headers, set }) => {
    try {
      const authHeader = headers.authorization || headers["authorization"];
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const token = authHeader.slice(7).trim();
      if (!token) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const user = await getCurrentUser(token);
      return { data: user };
    } catch (error: any) {
      if (error?.message === "Unauthorized") {
        set.status = 401;
        return { error: "Unauthorized" };
      }
      set.status = 500;
      return { error: error?.message || "Internal Server Error" };
    }
  });


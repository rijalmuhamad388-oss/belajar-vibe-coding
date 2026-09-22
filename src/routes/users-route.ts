import { Elysia, t } from "elysia";
import { registerUser, loginUser, getCurrentUser, logoutUser } from "../services/users-services";

export const usersRoute = new Elysia()
  .onError(({ code, error, set }) => {
    if (code === "VALIDATION") {
      return;
    }
    if (error?.message === "Unauthorized") {
      set.status = 401;
      return { error: "Unauthorized" };
    }
    set.status = 500;
    return { error: error?.message || "Internal Server Error" };
  })
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
        throw error;
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
        throw error;
      }
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
      }),
    }
  )
  .group("/api/users", (app) =>
    app
      .derive(({ headers }) => {
        const authHeader = headers.authorization || headers["authorization"];
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          throw new Error("Unauthorized");
        }

        const token = authHeader.slice(7).trim();
        if (!token) {
          throw new Error("Unauthorized");
        }

        return { token };
      })
      .get("/current", async ({ token }) => {
        const user = await getCurrentUser(token);
        return { data: user };
      })
      .delete("/logout", async ({ token }) => {
        await logoutUser(token);
        return { data: "OK" };
      })
  );



import { Elysia, t } from "elysia";
import { registerUser, loginUser } from "../services/users-services";

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
  );

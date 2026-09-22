import { Elysia } from "elysia";
import { usersRoute } from "./routes/users-route";

const port = process.env.PORT || 3000;

export const app = new Elysia()
  .use(usersRoute)
  .get("/", () => "Hello World")
  .listen(port);

console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`
);

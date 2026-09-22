import { eq } from "drizzle-orm";
import { db } from "../db";
import { users, type NewUser } from "../db/schema";

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
}

export const registerUser = async (input: RegisterUserInput) => {
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);

  if (existingUser.length > 0) {
    throw new Error("Email sudah terdaftar");
  }

  const hashedPassword = await Bun.password.hash(input.password, {
    algorithm: "bcrypt",
    cost: 10,
  });

  const newUser: NewUser = {
    name: input.name,
    email: input.email,
    password: hashedPassword,
  };

  await db.insert(users).values(newUser);

  return { data: "OK" };
};

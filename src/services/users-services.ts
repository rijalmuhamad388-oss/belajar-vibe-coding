import { eq } from "drizzle-orm";
import { db } from "../db";
import { users, sessions, type NewUser } from "../db/schema";

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginUserInput {
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

export const loginUser = async (input: LoginUserInput) => {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);

  if (!user) {
    throw new Error("Email atau password salah");
  }

  const isPasswordValid = await Bun.password.verify(input.password, user.password);
  if (!isPasswordValid) {
    throw new Error("Email atau password salah");
  }

  const token = crypto.randomUUID();

  await db.insert(sessions).values({
    token,
    userId: user.id,
  });

  return token;
};

export const getCurrentUser = async (token: string) => {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
    })
    .from(users)
    .innerJoin(sessions, eq(sessions.userId, users.id))
    .where(eq(sessions.token, token))
    .limit(1);

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
};

export const logoutUser = async (token: string) => {
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.token, token))
    .limit(1);

  if (!session) {
    throw new Error("Unauthorized");
  }

  await db.delete(sessions).where(eq(sessions.token, token));

  return { data: "OK" };
};


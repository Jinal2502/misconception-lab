import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { HttpError } from "../lib/httpErrors.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordWorkFactor = 12;
const dummyPasswordHash = bcrypt.hashSync("invalid-login-placeholder", passwordWorkFactor);

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

function validateCredentials(credentials, registration = false) {
  if (!credentials || typeof credentials !== "object" || Array.isArray(credentials)) {
    throw new HttpError(400, "Provide valid account details.");
  }
  const { name, email, password } = credentials;
  if (registration && (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 80)) {
    throw new HttpError(400, "Name must be between 2 and 80 characters.");
  }
  if (typeof email !== "string" || email.length > 254 || !emailPattern.test(email.trim())) {
    throw new HttpError(400, "Enter a valid email address.");
  }
  if (
    typeof password !== "string" ||
    password.length < 12 ||
    password.length > 128 ||
    !/[A-Za-z]/.test(password) ||
    !/\d/.test(password)
  ) {
    throw new HttpError(400, "Password must be 12–128 characters and include a letter and a number.");
  }
}

async function startSession(request, user) {
  await new Promise((resolve, reject) => {
    request.session.regenerate((error) => (error ? reject(error) : resolve()));
  });
  request.session.userId = user.id;
  await new Promise((resolve, reject) => {
    request.session.save((error) => (error ? reject(error) : resolve()));
  });
}

export async function register(request, response) {
  validateCredentials(request.body, true);
  const name = request.body.name.trim();
  const email = request.body.email.trim().toLowerCase();

  if (await User.exists({ email })) throw new HttpError(409, "An account with that email already exists.");

  const passwordHash = await bcrypt.hash(request.body.password, passwordWorkFactor);
  let user;
  try {
    user = await User.create({ name, email, passwordHash, role: "student" });
  } catch (error) {
    if (error.code === 11000) throw new HttpError(409, "An account with that email already exists.");
    throw error;
  }
  await startSession(request, user);
  response.status(201).json({ user: publicUser(user) });
}

export async function login(request, response) {
  const { email, password } = request.body ?? {};
  if (
    typeof email !== "string" ||
    email.length > 254 ||
    typeof password !== "string" ||
    password.length > 128
  ) {
    throw new HttpError(400, "Enter your email and password.");
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+passwordHash");
  const passwordMatches = await bcrypt.compare(password, user?.passwordHash ?? dummyPasswordHash);
  const expectedRole = request.body.role === "teacher" ? "teacher" : "student";
  if (!user || !passwordMatches || user.role !== expectedRole) {
    throw new HttpError(401, "Email or password is incorrect.");
  }

  await startSession(request, user);
  response.json({ user: publicUser(user) });
}

export async function logout(request, response, next) {
  request.session.destroy((error) => {
    if (error) {
      next(error);
      return;
    }
    response.clearCookie("misconception.sid", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    response.status(204).end();
  });
}

export function getCurrentUser(request, response) {
  response.json({ user: publicUser(request.user) });
}

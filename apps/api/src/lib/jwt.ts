import jwt from "jsonwebtoken";

function mustGet(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const SECRET = () => mustGet("JWT_SECRET");

export type JwtPayload = {
  userId: string;
  tenantId: string;
  role: "admin" | "tenant";
};

export function signJwt(payload: JwtPayload) {
  return jwt.sign(payload, SECRET(), { expiresIn: "30d" });
}

export function verifyJwt(token: string): JwtPayload {
  return jwt.verify(token, SECRET()) as JwtPayload;
}

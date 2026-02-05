import { verifyJwt, JwtPayload } from "./jwt";

export async function authGuard(req: any, reply: any) {
  const header = req.headers?.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) return reply.status(401).send({ error: "Missing Authorization Bearer token" });

  try {
    const payload = verifyJwt(token);
    req.user = payload as JwtPayload;
  } catch {
    return reply.status(401).send({ error: "Invalid token" });
  }
}

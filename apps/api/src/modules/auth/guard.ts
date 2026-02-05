import { verifyJwt } from "../../lib/jwt";

export default async function authGuard(req: any, reply: any) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return reply.status(401).send({ ok: false, error: "NO_TOKEN" });
  }

  const token = header.slice("Bearer ".length);

  try {
    req.user = verifyJwt(token);
  } catch {
    return reply.status(401).send({ ok: false, error: "INVALID_TOKEN" });
  }
}

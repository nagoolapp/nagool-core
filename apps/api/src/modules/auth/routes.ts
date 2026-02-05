import { z } from "zod";
import { getDb, admin } from "../../lib/firebaseAdmin";
import { hashPassword, verifyPassword } from "../../lib/password";
import { signJwt } from "../../lib/jwt";
import { authGuard } from "../../lib/authGuard";

const SignupBody = z.object({
  mobile: z.string().min(8),
  password: z.string().min(6),
  tenant: z.object({
    tenantId: z.string().min(2),
    name: z.string().min(2),
    industry: z.string().optional(),
    city: z.string().optional(),
  }),
});

const LoginBody = z.object({
  mobile: z.string().min(8),
  password: z.string().min(6),
});

export default async function authRoutes(app: any) {
  const db = getDb();
  const now = admin.firestore.FieldValue.serverTimestamp();

  app.post("/auth/signup", async (req: any, reply: any) => {
    const body = SignupBody.parse(req.body);

    // unique mobile
    const q = await db.collection("users").where("mobile", "==", body.mobile).limit(1).get();
    if (!q.empty) return reply.status(409).send({ error: "Mobile already registered" });

    // create tenant (trial)
    await db.doc(`tenants/${body.tenant.tenantId}`).set(
      {
        name: body.tenant.name,
        industry: body.tenant.industry ?? "",
        city: body.tenant.city ?? "",
        plan: "trial",
        limits: {},
        createdAt: now,
      },
      { merge: true }
    );

    await db.doc(`tenants/${body.tenant.tenantId}/config/main`).set(
      {
        tone: "friendly",
        language: "ar-OM",
        rules: [],
        createdAt: now,
        updatedAt: now,
      },
      { merge: true }
    );

    const passHash = await hashPassword(body.password);

    const userRef = await db.collection("users").add({
      mobile: body.mobile,
      passwordHash: passHash,
      role: "tenant",
      tenantId: body.tenant.tenantId,
      createdAt: now,
    });

    const token = signJwt({
      userId: userRef.id,
      tenantId: body.tenant.tenantId,
      role: "tenant",
    });

    return reply.send({ ok: true, userId: userRef.id, tenantId: body.tenant.tenantId, token });
  });

  app.post("/auth/login", async (req: any, reply: any) => {
    const body = LoginBody.parse(req.body);

    const q = await db.collection("users").where("mobile", "==", body.mobile).limit(1).get();
    if (q.empty) return reply.status(401).send({ error: "Invalid credentials" });

    const userDoc = q.docs[0];
    const user = userDoc.data() as any;

    const ok = await verifyPassword(body.password, user.passwordHash);
    if (!ok) return reply.status(401).send({ error: "Invalid credentials" });

    const token = signJwt({
      userId: userDoc.id,
      tenantId: user.tenantId,
      role: user.role,
    });

    return reply.send({ ok: true, userId: userDoc.id, tenantId: user.tenantId, role: user.role, token });
  });

  app.get("/me", { preHandler: authGuard }, async (req: any, reply: any) => {
    return reply.send({ ok: true, user: req.user });
  });
}

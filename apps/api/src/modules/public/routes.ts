import { z } from "zod";
import { getDb, admin } from "../../lib/firebaseAdmin";
import { hashPassword } from "../../lib/password";
import { signJwt } from "../../lib/jwt";
import { createWidgetKey, writeWidgetKeyIndex } from "../widgetKeys/service";

const SignupBody = z.object({
  mobile: z.string().min(8),
  password: z.string().min(6),
  businessName: z.string().min(2),
  industry: z.string().optional(),
  city: z.string().optional(),
});

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
}

function shortRand() {
  return Math.random().toString(36).slice(2, 8);
}

export default async function publicRoutes(app: any) {
  const db = getDb();
  const now = admin.firestore.FieldValue.serverTimestamp();

  app.post("/public/signup", async (req: any, reply: any) => {
    const body = SignupBody.parse(req.body);

    // check unique mobile
    const q = await db
      .collection("users")
      .where("mobile", "==", body.mobile)
      .limit(1)
      .get();

    if (!q.empty) {
      return reply.status(409).send({ ok: false, error: "MOBILE_EXISTS" });
    }

    // auto tenantId
    const tenantId = `${slugify(body.businessName)}-${shortRand()}`;

    // tenant
    await db.doc(`tenants/${tenantId}`).set(
      {
        name: body.businessName,
        industry: body.industry ?? "",
        city: body.city ?? "",
        plan: "trial",
        createdAt: now,
      },
      { merge: true }
    );

    // config
    await db.doc(`tenants/${tenantId}/config/main`).set(
      {
        business: {
          name: body.businessName,
          industry: body.industry ?? "",
          city: body.city ?? "",
          description: "",
        },
        tone: "friendly",
        language: "ar-OM",
        rules: [],
        createdAt: now,
        updatedAt: now,
      },
      { merge: true }
    );

    const passwordHash = await hashPassword(body.password);

    const userRef = await db.collection("users").add({
      mobile: body.mobile,
      passwordHash,
      role: "tenant",
      tenantId,
      createdAt: now,
    });

    const token = signJwt({
      userId: userRef.id,
      tenantId,
      role: "tenant",
    });

    const key = await createWidgetKey(tenantId, {
      allowedOrigins: ["*"],
      status: "active",
    });

    await writeWidgetKeyIndex(key.widgetKey, tenantId);

    const embedScript = `<script src="(YOUR_WIDGET_JS_URL)" data-nagool-api="(YOUR_API_BASE_URL)" data-nagool-key="${key.widgetKey}"></script>`;

    return reply.send({
      ok: true,
      tenantId,
      token,
      widgetKey: key.widgetKey,
      embedScript,
    });
  });
}

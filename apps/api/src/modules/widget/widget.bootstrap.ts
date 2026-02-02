import { FastifyInstance } from "fastify";
import { resolveTenantIdByWidgetKey } from "./widget.keys";

type UiConfig = {
  primaryColor: string;
  bgColor: string;
  textColor: string;
  borderRadius: number;
  logoUrl?: string;
  brandName?: string;
  rtl?: boolean;
};

type Language = {
  code: string;
  label: string;
  rtl?: boolean;
};

const LANGUAGES: Language[] = [
  { code: "ar-OM", label: "Arabic (Oman)", rtl: true },
  { code: "ar", label: "Arabic", rtl: true },
  { code: "fa", label: "Persian", rtl: true },
  { code: "en", label: "English" },

  { code: "ur", label: "Urdu", rtl: true },
  { code: "hi", label: "Hindi" },
  { code: "bn", label: "Bengali" },
  { code: "ta", label: "Tamil" },
  { code: "te", label: "Telugu" },

  { code: "zh", label: "Chinese (Mandarin)" },
  { code: "ru", label: "Russian" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "es", label: "Spanish" },
  { code: "pt", label: "Portuguese" },
  { code: "it", label: "Italian" },

  { code: "tr", label: "Turkish" },
  { code: "id", label: "Indonesian" },
  { code: "ms", label: "Malay" },
  { code: "th", label: "Thai" },
  { code: "vi", label: "Vietnamese" },
  { code: "tl", label: "Filipino" },

  { code: "ko", label: "Korean" },
  { code: "ja", label: "Japanese" },

  { code: "sw", label: "Swahili" },
  { code: "ha", label: "Hausa" },
  { code: "yo", label: "Yoruba" },

  { code: "uk", label: "Ukrainian" },
  { code: "pl", label: "Polish" },
  { code: "nl", label: "Dutch" },
];

export function widgetBootstrapRoutes(app: FastifyInstance) {
  app.get("/v1/widget/bootstrap", async (req, reply) => {
    const { widgetKey } = (req.query as any) ?? {};

    if (!widgetKey || typeof widgetKey !== "string") {
      return reply.status(400).send({ error: "widgetKey is required" });
    }

    const tenantId = resolveTenantIdByWidgetKey(widgetKey);
    if (!tenantId) {
      return reply.status(403).send({ error: "invalid widgetKey" });
    }

    if (!tenantId || typeof tenantId !== "string") {
      return reply.status(400).send({ error: "tenantId is required" });
    }

    const uiConfig: UiConfig = {
      primaryColor: "#fc0a7a",
      bgColor: "#0b0b0b",
      textColor: "#ffffff",
      borderRadius: 16,
      brandName: "Nagool",
      rtl: true,
    };

    return reply.send({
      ok: true,
      tenantId,
      uiConfig,
      languages: LANGUAGES,
      defaults: { language: "ar-OM" },
      requireStartForm: true,
    });
  });
}

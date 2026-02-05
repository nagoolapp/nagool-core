import getMyWidget from "./getMyWidget";
import authGuard from "../auth/guard";

export default async function widgetKeyRoutes(app: any) {
  app.get(
    "/widget/my",
    { preHandler: [authGuard] },
    getMyWidget
  );
}

export function resolveTenantIdFromWidgetKey(widgetKey: string) {
  // MVP mapping:
  // pub_demo -> demo
  if (!widgetKey.startsWith("pub_")) return null;
  const tenantId = widgetKey.slice("pub_".length);
  if (!tenantId) return null;
  return tenantId;
}

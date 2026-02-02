export type WidgetKeyRecord = {
  widgetKey: string;  // public key used in script tag
  tenantId: string;   // internal tenant id
  isActive: boolean;
};

const KEYS: WidgetKeyRecord[] = [
  { widgetKey: "pub_demo", tenantId: "demo", isActive: true },
  { widgetKey: "pub_test", tenantId: "demo", isActive: true },
];

export function resolveTenantIdByWidgetKey(widgetKey: string): string | null {
  const k = KEYS.find(x => x.widgetKey === widgetKey && x.isActive);
  return k?.tenantId || null;
}

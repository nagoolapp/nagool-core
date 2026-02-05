import { getDocJson, setDocMerge } from "../../lib/firestoreAdmin";

function todayKey() {
  const d = new Date();
  // YYYY-MM-DD in UTC (MVP)
  return d.toISOString().slice(0, 10);
}

export async function ensureDefaultLimits(tenantId: string) {
  const path = `tenants/${tenantId}/limits/main`;
  const cur = await getDocJson(path);
  if (cur) return;

  await setDocMerge(path, {
    trialDailyMessages: 30,
    createdAt: new Date().toISOString(),
  });
}

export async function checkAndIncDailyMessageLimit(tenantId: string) {
  await ensureDefaultLimits(tenantId);

  const limits = (await getDocJson(`tenants/${tenantId}/limits/main`)) ?? {};
  const max = Number(limits.trialDailyMessages ?? 30);

  const statsPath = `tenants/${tenantId}/stats/main`;
  const stats = (await getDocJson(statsPath)) ?? {};

  const today = todayKey();
  const dailyDate = String(stats.dailyDate ?? "");
  const dailyCount = Number(stats.dailyCount ?? 0);

  const nextCount = dailyDate === today ? (dailyCount + 1) : 1;

  if (nextCount > max) {
    return { ok: false as const, max, used: nextCount - 1 };
  }

  await setDocMerge(statsPath, {
    dailyDate: today,
    dailyCount: nextCount,
    lastMessageAt: new Date().toISOString(),
  });

  return { ok: true as const, max, used: nextCount };
}

import { setDocMerge, getDocJson } from "../../lib/firestoreAdmin";

export async function trackUsage(tenantId: string, usage: { messagesInc?: number; tokensInc?: number }) {
  const incMessages = usage.messagesInc ?? 1;
  const incTokens = usage.tokensInc ?? 0;

  const path = `tenants/${tenantId}/stats/main`;
  const cur = (await getDocJson(path)) ?? {};
  const curMsg = Number(cur.messageCount ?? 0);
  const curTok = Number(cur.tokenCount ?? 0);

  await setDocMerge(path, {
    messageCount: curMsg + incMessages,
    tokenCount: curTok + incTokens,
    lastMessageAt: new Date().toISOString(),
  });
}

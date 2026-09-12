import { hookQueries, mediaQueries, settingsQueries, shortQueries } from '@/lib/db/queries';
import { renderQueue } from '@/lib/render-queue';
import { generateId } from '@/lib/utils';
import { generateShortContent } from '@/lib/ai';

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function pickRandomN<T>(items: T[], n: number): T[] {
  const copy = [...items];
  const out: T[] = [];
  while (out.length < n && copy.length) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return out;
}

export async function generateAutoShort(publish: boolean): Promise<boolean> {
  const hooks = await hookQueries.findActive();
  const media = await mediaQueries.findAll();
  if (!hooks.length || !media.length) return false;

  const selected = pickRandomN(media, Math.min(3, media.length));
  const idea = await generateShortContent(selected.map(m => m.name));

  let hookId: string;
  let hookText: string;
  if (idea?.hook) {
    const created = await hookQueries.create(idea.hook);
    hookId = created.id;
    hookText = created.text;
  } else {
    const hook = pickRandom(hooks);
    hookId = hook.id;
    hookText = hook.text;
  }

  const short = await shortQueries.create({
    id: generateId(),
    hookId,
    hookText,
    mediaIds: selected.map(m => m.id),
    title: idea?.title ?? `Short - ${hookText.slice(0, 40)}`,
    description: idea?.description ?? '',
    tags: idea?.tags ?? [],
    status: 'draft',
  });
  if (!short) return false;

  await renderQueue.add(short.id);
  if (publish) await shortQueries.updateStatus(short.id, 'accepted');
  return true;
}

export async function maybeRunAutoShorts(): Promise<number> {
  const settings = await settingsQueries.find();
  const perDay = settings?.autoShortsPerDay ?? 2;
  const publish = !!(settings?.autoPublish ?? 0);
  const autoRuns: string[] = Array.isArray(settings?.autoRuns) ? settings.autoRuns : [];

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const minutesOfDay = now.getHours() * 60 + now.getMinutes();
  const firstSlot = 9 * 60;
  const interval = Math.floor(1440 / perDay);

  const dueSlots: number[] = [];
  for (let k = 0; k < perDay; k++) {
    const slot = firstSlot + k * interval;
    if (slot >= 1440) break;
    const marker = `${today}|${k}`;
    if (minutesOfDay >= slot && !autoRuns.includes(marker)) dueSlots.push(k);
  }

  if (!dueSlots.length) return 0;

  let ran = 0;
  for (const k of dueSlots) {
    try {
      if (await generateAutoShort(publish)) {
        autoRuns.push(`${today}|${k}`);
        ran++;
      }
    } catch (error: any) {
      console.error('[Auto] Failed to generate short:', error.message);
    }
  }

  if (ran) await settingsQueries.update({ autoRuns });
  return ran;
}
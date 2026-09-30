import { cookies } from 'next/headers';
import { GoalList } from '@/components/GoalList';
import { listActiveGoals, listArchivedGoals } from '@/db/queries';
import { requireUser } from '@/lib/auth';

export default async function HomePage() {
  const user = await requireUser();
  const [activeGoals, archivedGoals, cookieStore] = await Promise.all([
    listActiveGoals(user.id),
    listArchivedGoals(user.id),
    cookies(),
  ]);

  const settingsCookie = cookieStore.get('settings')?.value;
  let initialSound = false;
  if (settingsCookie) {
    try {
      const parsed = JSON.parse(decodeURIComponent(settingsCookie));
      initialSound = Boolean(parsed.sound);
    } catch {}
  }

  return (
    <div className="min-h-screen bg-bg text-text-primary px-4 py-8 sm:py-16 selection:bg-gold/20 selection:text-gold">
      <div className="mx-auto w-full max-w-[640px]">
        <main>
          <GoalList
            user={{ name: user.name ?? undefined, email: user.email, image: user.image ?? undefined }}
            initialGoals={activeGoals}
            initialArchivedGoals={archivedGoals}
            initialSoundEnabled={initialSound}
          />
        </main>
      </div>
    </div>
  );
}

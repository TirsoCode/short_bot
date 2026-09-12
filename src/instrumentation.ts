export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { startScheduler } = await import('./lib/scheduler');
  try {
    startScheduler();
  } catch (error) {
    console.error('Failed to start scheduler:', error);
  }
}
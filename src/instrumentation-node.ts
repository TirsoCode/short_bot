export async function register() {
  const { startScheduler } = await import('./lib/scheduler');
  try {
    startScheduler();
  } catch (error) {
    console.error('Failed to start scheduler:', error);
  }
}
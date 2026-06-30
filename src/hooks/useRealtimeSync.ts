import { useEffect } from "react";

/**
 * Simple periodic + beforeunload sync helper.
 * Accepts a callback that should call the appropriate upsert functions.
 *
 * Usage in a component (e.g., HydrationTracker):
 *   useRealtimeSync(userId, () => {
 *     upsertHydrationLog(userId, currentLog).catch(console.error);
 *   });
 *
 * @param userId - Supabase auth user id. If null, sync is paused.
 * @param syncFn - Function to execute on interval or beforeunload.
 * @param intervalMs - Sync interval in milliseconds (default 30_000 = 30s).
 */
export function useRealtimeSync(
  userId: string | null,
  syncFn: () => void | Promise<void>,
  intervalMs: number = 30_000
) {
  useEffect(() => {
    if (!userId) return;

    // Periodic sync
    const intervalId = window.setInterval(() => {
      try {
        const result = syncFn();
        if (result && typeof (result as any).catch === "function") {
          (result as Promise<void>).catch((err) =>
            console.error("[useRealtimeSync] periodic sync error:", err)
          );
        }
      } catch (err) {
        console.error("[useRealtimeSync] periodic sync error:", err);
      }
    }, intervalMs);

    // beforeunload sync
    const handleBeforeUnload = () => {
      try {
        const result = syncFn();
        if (result && typeof (result as any).catch === "function") {
          (result as Promise<void>).catch((err) =>
            console.error("[useRealtimeSync] beforeunload sync error:", err)
          );
        }
      } catch (err) {
        console.error("[useRealtimeSync] beforeunload sync error:", err);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [userId, syncFn, intervalMs]);
}

import { useEffect, useMemo, useState } from "react";
import { Bell, Clock, Droplets, Utensils } from "lucide-react";
import { toast } from "sonner";
import type { Locale, UserPreferences } from "../types";
import { t } from "../i18n";

type Props = {
  preferences: UserPreferences;
  onUpdatePreferences: (updated: Partial<UserPreferences>) => void;
  locale: Locale;
};

const LAST_HYDRATION_REMINDER_KEY = "nutri_last_hydration_reminder";
const LAST_MEAL_REMINDER_KEY = "nutri_last_meal_reminder";

function minutesSince(timestamp: number | null) {
  if (!timestamp) return Number.POSITIVE_INFINITY;
  return (Date.now() - timestamp) / 60000;
}

function isInsideActiveWindow(start: string, end: string) {
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  const startTotal = startHour * 60 + startMinute;
  const endTotal = endHour * 60 + endMinute;

  if (startTotal <= endTotal) {
    return current >= startTotal && current <= endTotal;
  }

  return current >= startTotal || current <= endTotal;
}

function sendLocalReminder(title: string, body: string) {
  toast(title, { description: body, duration: 9000 });

  if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
    });
  }
}

export default function ReminderCenter({ preferences, onUpdatePreferences, locale }: Props) {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "denied",
  );

  const reminders = useMemo(() => preferences.reminders ?? {
    hydrationEnabled: true,
    hydrationIntervalMinutes: 120,
    mealEnabled: true,
    mealIntervalHours: preferences.prescriptionMealIntervalHours ?? 3,
    activeStart: "08:00",
    activeEnd: "21:00",
  }, [preferences.reminders, preferences.prescriptionMealIntervalHours]);

  const hasGlp1Treatment = preferences.clinicalTreatment === "mounjaro" || preferences.clinicalTreatment === "ozempic";

  const updateReminders = (patch: Partial<typeof reminders>) => {
    onUpdatePreferences({
      reminders: {
        ...reminders,
        ...patch,
      },
    });
  };

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      toast.error("Seu navegador não suporta notificações locais.");
      return;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") {
      sendLocalReminder(t(locale, "remindersTitle"), t(locale, "permissionGranted"));
    }
  };

  const testReminder = () => {
    sendLocalReminder(t(locale, "drinkWaterTitle"), t(locale, "drinkWaterBody", { goal: preferences.dailyWaterGoal }));
    toast.success(t(locale, "reminderSent"));
  };

  useEffect(() => {
    const checkReminders = () => {
      if (!isInsideActiveWindow(reminders.activeStart, reminders.activeEnd)) return;

      if (reminders.hydrationEnabled) {
        const lastHydration = Number(localStorage.getItem(LAST_HYDRATION_REMINDER_KEY) || "0") || null;
        if (minutesSince(lastHydration) >= reminders.hydrationIntervalMinutes) {
          sendLocalReminder(t(locale, "drinkWaterTitle"), t(locale, "drinkWaterBody", { goal: preferences.dailyWaterGoal }));
          localStorage.setItem(LAST_HYDRATION_REMINDER_KEY, String(Date.now()));
        }
      }

      if (hasGlp1Treatment && reminders.mealEnabled) {
        const lastMeal = Number(localStorage.getItem(LAST_MEAL_REMINDER_KEY) || "0") || null;
        if (minutesSince(lastMeal) >= reminders.mealIntervalHours * 60) {
          sendLocalReminder(t(locale, "mealTitle"), t(locale, "mealBody"));
          localStorage.setItem(LAST_MEAL_REMINDER_KEY, String(Date.now()));
        }
      }
    };

    const timeoutId = window.setTimeout(checkReminders, 5000);
    const intervalId = window.setInterval(checkReminders, 60000);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [hasGlp1Treatment, locale, preferences.dailyWaterGoal, reminders.activeEnd, reminders.activeStart, reminders.hydrationEnabled, reminders.hydrationIntervalMinutes, reminders.mealEnabled, reminders.mealIntervalHours]);

  const permissionLabel = permission === "granted"
    ? t(locale, "permissionGranted")
    : permission === "denied"
      ? t(locale, "permissionDenied")
      : t(locale, "permissionDefault");

  return (
    <section className="bg-white rounded-3xl p-5 shadow-sm border border-blue-100 flex flex-col gap-4 animate-fade">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-heading font-extrabold text-stone-800 text-sm">{t(locale, "remindersTitle")}</h2>
            <p className="text-[11px] text-stone-500 font-medium mt-0.5">{t(locale, "remindersSubtitle")}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={testReminder}
          className="text-[11px] font-extrabold px-3 py-2 rounded-xl bg-stone-900 text-white hover:bg-stone-700 btn-interactive"
        >
          {t(locale, "testReminder")}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-2xl bg-stone-50 border border-stone-100 p-3 flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-wider text-stone-400 font-extrabold">{t(locale, "notificationPermission")}</span>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-stone-700">{permissionLabel}</span>
            {permission !== "granted" && permission !== "denied" && (
              <button
                type="button"
                onClick={requestPermission}
                className="text-[10px] font-extrabold px-2.5 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                {t(locale, "requestPermission")}
              </button>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-cyan-50 border border-cyan-100 p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-cyan-700">
              <Droplets className="w-4 h-4" />
              <span className="text-xs font-extrabold">{t(locale, "hydrationReminder")}</span>
            </div>
            <input
              type="checkbox"
              checked={reminders.hydrationEnabled}
              onChange={(e) => updateReminders({ hydrationEnabled: e.target.checked })}
              className="accent-cyan-600"
            />
          </div>
          <p className="text-[11px] text-stone-500 font-medium">{t(locale, "hydrationReminderDescription")}</p>
          <select
            value={reminders.hydrationIntervalMinutes}
            onChange={(e) => updateReminders({ hydrationIntervalMinutes: Number(e.target.value) })}
            className="text-xs p-2 rounded-xl border border-cyan-100 bg-white font-bold outline-none"
          >
            {[60, 90, 120, 180].map((minutes) => (
              <option key={minutes} value={minutes}>{t(locale, "everyMinutes", { minutes })}</option>
            ))}
          </select>
        </div>

        <div className="rounded-2xl bg-pink-50 border border-pink-100 p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-pink-700">
              <Utensils className="w-4 h-4" />
              <span className="text-xs font-extrabold">{t(locale, "mealReminder")}</span>
            </div>
            <input
              type="checkbox"
              checked={reminders.mealEnabled && hasGlp1Treatment}
              disabled={!hasGlp1Treatment}
              onChange={(e) => updateReminders({ mealEnabled: e.target.checked })}
              className="accent-pink-600 disabled:opacity-40"
            />
          </div>
          <p className="text-[11px] text-stone-500 font-medium">
            {hasGlp1Treatment ? t(locale, "mealReminderDescription") : t(locale, "remindersOnlyGlp1")}
          </p>
          <select
            value={reminders.mealIntervalHours}
            disabled={!hasGlp1Treatment}
            onChange={(e) => updateReminders({ mealIntervalHours: Number(e.target.value) })}
            className="text-xs p-2 rounded-xl border border-pink-100 bg-white font-bold outline-none disabled:opacity-50"
          >
            {[2, 3, 4, 5].map((hours) => (
              <option key={hours} value={hours}>{t(locale, "everyHours", { hours })}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between rounded-2xl bg-amber-50 border border-amber-100 px-3 py-2">
        <div className="flex items-center gap-2 text-amber-700">
          <Clock className="w-4 h-4" />
          <span className="text-xs font-extrabold">{t(locale, "activeWindow")}</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="time"
            value={reminders.activeStart}
            onChange={(e) => updateReminders({ activeStart: e.target.value })}
            className="text-xs p-2 rounded-xl border border-amber-100 bg-white font-bold outline-none"
          />
          <span className="text-xs font-bold text-stone-400">—</span>
          <input
            type="time"
            value={reminders.activeEnd}
            onChange={(e) => updateReminders({ activeEnd: e.target.value })}
            className="text-xs p-2 rounded-xl border border-amber-100 bg-white font-bold outline-none"
          />
        </div>
      </div>

      <p className="text-[10px] leading-relaxed text-stone-400 font-semibold">{t(locale, "reminderNote")}</p>
    </section>
  );
}

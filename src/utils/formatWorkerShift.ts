/**
 * Utility to format worker preferred shift / time slot cleanly from preferred_shift string or availability_slots object
 */

export const ALL_SHIFT_OPTIONS = [
  'Full Day (8–12 Hours)',
  'Early Morning (6 AM – 9 AM)',
  'Morning Shift (9 AM – 12 PM)',
  'Afternoon Shift (12 PM – 3 PM)',
  'Evening Shift (3 PM – 6 PM)',
  'Night Shift (6 PM – 9 PM)',
  'Live-In (24x7)',
  'Part-Time Flexible'
];

export function normalizeShiftOption(val?: string | null): string {
  if (!val || typeof val !== 'string' || !val.trim()) return 'Full Day (8–12 Hours)';
  const lower = val.toLowerCase().trim();

  if (lower.includes('early morning') || (lower.includes('6 am') && lower.includes('9 am'))) {
    return 'Early Morning (6 AM – 9 AM)';
  }
  if (lower.includes('morning shift') || lower.includes('9 am') || (lower.includes('morning') && !lower.includes('early'))) {
    return 'Morning Shift (9 AM – 12 PM)';
  }
  if (lower.includes('afternoon') || lower.includes('12 pm') || lower.includes('3 pm')) {
    return 'Afternoon Shift (12 PM – 3 PM)';
  }
  if (lower.includes('evening') || lower.includes('4 pm')) {
    return 'Evening Shift (3 PM – 6 PM)';
  }
  if (lower.includes('night')) {
    return 'Night Shift (6 PM – 9 PM)';
  }
  if (lower.includes('live-in') || lower.includes('live in') || lower.includes('24x7') || lower.includes('24 hours')) {
    return 'Live-In (24x7)';
  }
  if (lower.includes('part-time') || lower.includes('part time') || lower.includes('flexible')) {
    return 'Part-Time Flexible';
  }
  if (lower.includes('full day') || lower.includes('full-day') || lower.includes('8–12') || lower.includes('8-12')) {
    return 'Full Day (8–12 Hours)';
  }

  const matched = ALL_SHIFT_OPTIONS.find(opt => 
    opt.toLowerCase() === lower || 
    opt.toLowerCase().includes(lower) || 
    lower.includes(opt.toLowerCase())
  );
  if (matched) return matched;

  return val.trim();
}

export function formatWorkerShift(preferred_shift?: string | null, availability_slots?: any): string {
  if (preferred_shift && typeof preferred_shift === 'string' && preferred_shift.trim()) {
    return normalizeShiftOption(preferred_shift.trim());
  }

  if (!availability_slots || typeof availability_slots !== 'object') {
    return 'Full Day (8–12 Hours)';
  }

  if (availability_slots.live_in) return 'Live-In (24x7)';
  if (availability_slots.full_day) return 'Full Day (8–12 Hours)';

  const grid = availability_slots.weekly_grid || availability_slots;
  const foundSlots = new Set<string>();

  const SLOT_NAME_MAP: Record<string, string> = {
    early_morning: 'Early Morning (6 AM – 9 AM)',
    morning: 'Morning Shift (9 AM – 12 PM)',
    afternoon: 'Afternoon Shift (12 PM – 3 PM)',
    evening: 'Evening Shift (3 PM – 6 PM)',
    night: 'Night Shift (6 PM – 9 PM)',
    full_day: 'Full Day (8–12 Hours)',
    live_in: 'Live-In (24x7)',
    part_time: 'Part-Time Flexible'
  };

  if (grid && typeof grid === 'object') {
    Object.values(grid).forEach((val: any) => {
      if (Array.isArray(val)) {
        val.forEach((slot: string) => {
          if (SLOT_NAME_MAP[slot]) foundSlots.add(SLOT_NAME_MAP[slot]);
          else if (typeof slot === 'string' && slot.trim()) foundSlots.add(slot.trim());
        });
      }
    });
  }

  if (foundSlots.size > 0) {
    const firstFound = Array.from(foundSlots)[0];
    return normalizeShiftOption(firstFound);
  }

  return 'Full Day (8–12 Hours)';
}

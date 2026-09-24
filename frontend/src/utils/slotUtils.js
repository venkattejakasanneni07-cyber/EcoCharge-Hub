/**
 * Generate all time slots for a day (e.g., 6 AM to 10 PM, every 1 hour)
 */
export const generateTimeSlots = (startHour = 6, endHour = 22, slotDurationMin = 60) => {
  const slots = [];
  for (let hour = startHour; hour < endHour; hour++) {
    for (let min = 0; min < 60; min += slotDurationMin) {
      const h = hour.toString().padStart(2, '0');
      const m = min.toString().padStart(2, '0');
      const endMin = min + slotDurationMin;
      const endHourCalc = endMin >= 60 ? hour + 1 : hour;
      const endMinCalc = endMin >= 60 ? endMin - 60 : endMin;
      const eh = endHourCalc.toString().padStart(2, '0');
      const em = endMinCalc.toString().padStart(2, '0');
      slots.push({
        start: `${h}:${m}`,
        end: `${eh}:${em}`,
        label: `${format12h(h, m)} - ${format12h(eh, em)}`,
      });
    }
  }
  return slots;
};

/**
 * Format 24h time to 12h with AM/PM
 */
export const format12h = (hour, min) => {
  const h = parseInt(hour, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${min} ${ampm}`;
};

/**
 * Check if a time slot conflicts with existing bookings
 * @param {string} slotStart - e.g. "10:00"
 * @param {string} slotEnd - e.g. "11:00"
 * @param {Array} existingBookings - array of bookings with { startTime, endTime, duration }
 * @param {string} selectedDate - e.g. "2026-09-25"
 */
export const isSlotBlocked = (slotStart, slotEnd, existingBookings, selectedDate) => {
  // Convert slot to minutes
  const [sh, sm] = slotStart.split(':').map(Number);
  const [eh, em] = slotEnd.split(':').map(Number);
  const slotStartMin = sh * 60 + sm;
  const slotEndMin = eh * 60 + em;

  return existingBookings.some((booking) => {
    // Only check bookings for the same date
    if (booking.date !== selectedDate) return false;

    // Skip cancelled bookings
    if (booking.status === 'cancelled') return false;

    // Compute booking start and end in minutes
    const [bsh, bsm] = (booking.startTime || '00:00').split(':').map(Number);
    const bookingStartMin = bsh * 60 + bsm;

    // Duration can be in hours (from form) or minutes
    let durationMin = booking.duration || 60;
    if (durationMin < 10) durationMin *= 60; // Convert hours → minutes
    const bookingEndMin = bookingStartMin + durationMin;

    // Overlap check: slot overlaps if start < bookingEnd AND end > bookingStart
    return slotStartMin < bookingEndMin && slotEndMin > bookingStartMin;
  });
};

/**
 * Check if a time slot is in the past (for today's bookings)
 */
export const isPastSlot = (slotStart, selectedDate) => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  if (selectedDate !== todayStr) return false;

  const [sh, sm] = slotStart.split(':').map(Number);
  const slotTime = new Date();
  slotTime.setHours(sh, sm, 0, 0);

  return slotTime < today;
};

/**
 * Get today's date in YYYY-MM-DD format
 */
export const getTodayString = () => new Date().toISOString().split('T')[0];
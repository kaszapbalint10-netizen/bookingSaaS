function calculatePrice(agentType, pricing, booking = {}) {
  if (!pricing) return null;

  if (agentType === 'car-rental') {
    const carType = (booking.car_type || '').toLowerCase();
    const base = pricing.categories?.[carType]?.base_price ?? 10000;
    const days = Math.max(1, Number(booking.days || 1));
    let total = base * days;

    if (pricing.discounts?.monthly && days > pricing.discounts.monthly.days)
      total *= (1 - pricing.discounts.monthly.percent / 100);
    else if (pricing.discounts?.weekly && days > pricing.discounts.weekly.days)
      total *= (1 - pricing.discounts.weekly.percent / 100);

    if (booking.pickup_location && booking.return_location &&
        booking.pickup_location !== booking.return_location) {
      total += pricing.extra_fees?.one_way ?? 0;
    }
    return Math.round(total);
  }

  return 0;
}

module.exports = { calculatePrice };

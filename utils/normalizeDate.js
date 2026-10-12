const normalizeDate = (date) => {
  if (!date) return date;

  const normalizedDate = new Date(date);

  normalizedDate.setUTCHours(0, 0, 0, 0);

  return normalizedDate;
};

module.exports = normalizeDate;

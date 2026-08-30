export const formatSeguimientoDate = (date: Date): string => {
  const weekday = new Intl.DateTimeFormat("es", { weekday: "long" })
    .format(date)
    .slice(0, 3)
    .toLocaleLowerCase("es");
  const month = new Intl.DateTimeFormat("es", { month: "long" })
    .format(date)
    .slice(0, 3)
    .toLocaleLowerCase("es");
  const year = String(date.getFullYear()).slice(-2);

  return `${weekday}, ${date.getDate()} ${month} ${year}`;
};

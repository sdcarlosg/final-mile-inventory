const formatDateOnly = (dateStr) => {
  if (!dateStr || dateStr === "N/A") return "N/A";
  if (typeof dateStr === "string") {
    return dateStr.split(/[\sT]/)[0];
  }
  return dateStr;
};

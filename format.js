export const formatCurrency = (value) => {
  const num = Number(value) || 0;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
};

export const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const formatDateShort = (dateStr) => {
  if (!dateStr) return "—";
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
};

export const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export const getMonthLabel = (dateStr) => {
  const date = new Date(dateStr + "T00:00:00");
  return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
};

export const calculateAge = (birthDate) => {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate + "T00:00:00");
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

export const categoryColors = {
  "Mesada": "#10b981",
  "Educação": "#3b82f6",
  "Saúde": "#ef4444",
  "Alimentação": "#f59e0b",
  "Transporte": "#8b5cf6",
  "Lazer": "#ec4899",
  "Vestuário": "#06b6d4",
  "Moradia": "#6366f1",
  "Investimento": "#14b8a6",
  "Emergência": "#f97316",
  "Outro": "#64748b",
};

export const getCategoryColor = (category) => categoryColors[category] || "#64748b";

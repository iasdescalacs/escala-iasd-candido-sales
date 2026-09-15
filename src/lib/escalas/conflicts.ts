export function formatScheduleConflictNotice({
  churchName,
  serviceDate,
  subjectName,
}: {
  churchName: string;
  serviceDate: string;
  subjectName: string;
}) {
  const formattedDate = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
    new Date(`${serviceDate}T00:00:00.000Z`),
  );

  return `Conflito de escala: ${subjectName} já participa da escala em ${churchName} no dia ${formattedDate}. Escolha outra opção.`;
}

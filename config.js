// 1) Convierte tu Excel a Google Sheets.
// 2) En Google Sheets: Archivo > Compartir > Publicar en la web.
// 3) Publica cada hoja necesaria como CSV.
// 4) Pega aquí las URLs CSV generadas.
//
// También puedes usar URLs tipo:
// https://docs.google.com/spreadsheets/d/e/XXXXXXXX/pub?gid=0&single=true&output=csv

window.POLLA_CONFIG = {
  title: "Polla Familiar Mundial 2026",

  // Obligatoria: hoja Ranking
  rankingCsvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTp3eOMgvsIu3FPATnQxbxVVnoS3ntL4N8hHmPoqFGYwi2_nbi2Dya21ZwfAeyhlQ/pub?gid=1020095959&single=true&output=csv",

  // Obligatoria: hoja Resultados
  resultsCsvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTp3eOMgvsIu3FPATnQxbxVVnoS3ntL4N8hHmPoqFGYwi2_nbi2Dya21ZwfAeyhlQ/pub?gid=39821786&single=true&output=csv",

  // Opcional pero recomendada: hoja Puntajes para detalle por participante
  scoresCsvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTp3eOMgvsIu3FPATnQxbxVVnoS3ntL4N8hHmPoqFGYwi2_nbi2Dya21ZwfAeyhlQ/pub?gid=1666057862&single=true&output=csv",

  // Si no quieres detalle por participante todavía, deja scoresCsvUrl vacío: ""
};

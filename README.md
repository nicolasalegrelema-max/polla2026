# Dashboard Polla Familiar Mundial 2026

Este dashboard está listo para subir a GitHub Pages o Netlify. Lee datos desde Google Sheets publicado como CSV.

## 1. Preparar Google Sheets

Convierte tu Excel a Google Sheets y deja estas hojas:

### Ranking
Debe tener columnas como:

```text
Puesto | Participante | Octavos | Cuartos | Semifinal | 3er y 4to puesto | Final | Bonus | Total
```

### Resultados
Debe tener columnas como:

```text
Orden | Ronda | Equipo A | Goles A | Goles B | Equipo B | Clasificado
```

### Puntajes
Opcional, para mostrar detalle por participante. Debe tener columnas como:

```text
Participante | Orden | Ronda | Partido | Equipo A | Goles A | Goles B | Equipo B | Clasificado pronosticado | Puntos
```

## 2. Publicar hojas como CSV

En Google Sheets:

1. Archivo > Compartir > Publicar en la web.
2. En vez de "Documento completo", selecciona una hoja específica.
3. Selecciona formato CSV.
4. Publica.
5. Copia el link.
6. Repite para Ranking, Resultados y Puntajes.

El link suele verse así:

```text
https://docs.google.com/spreadsheets/d/e/XXXXXXXX/pub?gid=0&single=true&output=csv
```

## 3. Configurar el dashboard

Abre `config.js` y reemplaza:

```js
rankingCsvUrl: "PEGA_AQUI_LA_URL_CSV_DE_LA_HOJA_RANKING",
resultsCsvUrl: "PEGA_AQUI_LA_URL_CSV_DE_LA_HOJA_RESULTADOS",
scoresCsvUrl: "PEGA_AQUI_LA_URL_CSV_DE_LA_HOJA_PUNTAJES",
```

por tus links reales.

Si todavía no quieres detalle por participante:

```js
scoresCsvUrl: "",
```

## 4. Subir a GitHub Pages

1. Crea un repositorio nuevo en GitHub.
2. Sube estos archivos:
   - `index.html`
   - `styles.css`
   - `script.js`
   - `config.js`
   - `README.md`
3. Entra a Settings > Pages.
4. En Source selecciona `Deploy from a branch`.
5. Selecciona rama `main` y carpeta `/root`.
6. Guarda.
7. GitHub te dará un link público.

## 5. Uso diario

Solo actualiza tu Google Sheet en la hoja Resultados. La página se actualizará leyendo el CSV publicado.

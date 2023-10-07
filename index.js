const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const port = 3000;

app.get('/', async (req, res) => {
  try {
    const filmesInfo = await extrairFilmesInfo();
    const htmlResponse = gerarPaginaHTML(filmesInfo);
    res.send(htmlResponse);
  } catch (error) {
    res.status(500).send('Erro ao extrair as informações dos filmes.');
  }
});

async function extrairFilmesInfo() {
  try {
    const response = await axios.get('https://ucicinemas.pt/Filmes/Proximos');
    const html = response.data;
    const $ = cheerio.load(html);

    const filmes = $('.listado-peliculas-item');
    const filmesInfo = [];

    filmes.each((index, elemento) => {
      const poster = $(elemento).find('.cartel').attr('src');
      const title = $(elemento).find('.vf').text().trim();

      filmesInfo.push({ poster, title });
    });

    return filmesInfo;
  } catch (error) {
    throw error;
  }
}

function gerarPaginaHTML(filmesInfo) {
  const filmesHTML = filmesInfo
    .map(({ poster, title }) => `
      <li>
        <a href="${getYouTubeLink(title)}" target="_blank">
          <img src="${poster}" alt="Capa do Filme">
        </a>
      </li>
    `)
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Capas dos Filmes</title>
      <style>
        /* Estilo para cada capa de filme */
        li {
          background-color: #fff;
          border: 1px solid #ddd;
          margin: 10px;
          padding: 10px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          width: 150px; /* Reduced width for smaller movie posters */
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        /* Estilo para a imagem da capa do filme */
        li img {
          max-width: 100%;
          height: auto;
          margin-top: 10px;
          width: 100%; /* Set width to 100% to ensure it respects the container's width */
        }

        /* Estilo para o contêiner de capas */
        ul {
          list-style: none;
          padding: 0;
          display: flex;
          flex-wrap: wrap; /* Permite que as capas quebrem para a linha seguinte quando não há espaço suficiente */
          justify-content: center;
        }
      </style>
    </head>
    <body>
      <h1>Proximos Filmes UCI</h1>
      <ul>${filmesHTML}</ul>
    </body>
    </html>
  `;
}

function getYouTubeLink(title) {
  const sanitizedTitle = title.replace(/\s/g, '+'); // Replace spaces with '+'
  const keywords = 'official+trailer'; // Specific keywords for trailer search
  return `https://www.youtube.com/results?search_query=${sanitizedTitle}+${keywords}`;
}

app.listen(port, () => {
  console.log(`Servidor está rodando em http://localhost:${port}`);
});

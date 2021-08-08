require('dotenv').config();

const Hapi = require('@hapi/hapi');
const songs = require('./api/songs');
const SongsService = require('./service/postgres/SongsService');
const SongsValidator = require('./validator/songs');

const init = async () => {
  const songService = new SongsService();

  const server = Hapi.server({
    port: process.env.PORT,
    host: process.env.HOST,
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  await server.register({
    plugin: songs,
    options: {
      service: songService,
      validator: SongsValidator,
    },
  });

  await server.start();
  // eslint-disable-next-line no-console
  console.log(`server started on ${server.info.uri}`);
};

init();

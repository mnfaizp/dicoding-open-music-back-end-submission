require('dotenv').config();

const Hapi = require('@hapi/hapi');
const songs = require('./api/songs');
const ClientError = require('./exceptions/ClientError');
const SongsService = require('./service/postgres/SongsService');
const SongsValidator = require('./validator/songs');

const users = require('./api/users');
const UsersService = require('./service/postgres/UsersService');
const UsersValidator = require('./validator/users');

const init = async () => {
  const songService = new SongsService();
  const userService = new UsersService();

  const server = Hapi.server({
    port: process.env.PORT,
    host: process.env.HOST,
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  await server.register([
    {
      plugin: songs,
      options: {
        service: songService,
        validator: SongsValidator,
      },
    },
    {
      plugin: users,
      options: {
        service: userService,
        validator: UsersValidator,
      },
    },
  ]);

  await server.ext('onPreResponse', (reqeuest, h) => {
    // mendapatkan konteks dari request
    const { response } = reqeuest;

    if (response instanceof ClientError) {
      const newResponse = h.response({
        status: 'fail',
        message: response.message,
      });
      newResponse.code(response.statusCode);
      return newResponse;
    }

    if (response instanceof Error) {
      console.log(response);
      const newResponse = h.response({
        status: 'error',
        message: 'Something wrong with the server',
      });
      newResponse.code(500);
      return newResponse;
    }

    return response.continue || response;
  });

  await server.start();
  // eslint-disable-next-line no-console
  console.log(`server started on ${server.info.uri}`);
};

init();

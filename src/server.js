require('dotenv').config();

const Hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt');

// exceptions
const ClientError = require('./exceptions/ClientError');

// songs plugin
const songs = require('./api/songs');
const SongsService = require('./service/postgres/SongsService');
const SongsValidator = require('./validator/songs');

// users plugin
const users = require('./api/users');
const UsersService = require('./service/postgres/UsersService');
const UsersValidator = require('./validator/users');

// authentications plugin
const authentications = require('./api/authentications');
const AuthenticationsService = require('./service/postgres/AuthenticationsService');
const TokenManager = require('./tokenize/TokenManager');
const AuthenticationsValidator = require('./validator/authentications');

// playlists plugin
const playlists = require('./api/playlists');
const PlaylistsService = require('./service/postgres/PlaylistsService');
const PlaylistsValidator = require('./validator/playlists');

// collaborations plugin
const collaborations = require('./api/collaborations');
const CollaborationsService = require('./service/postgres/CollaborationsService');

const init = async () => {
  const songService = new SongsService();
  const userService = new UsersService();
  const authenticationsService = new AuthenticationsService();
  const collaborationsService = new CollaborationsService();
  const playlistsService = new PlaylistsService(collaborationsService);

  const server = Hapi.server({
    port: process.env.PORT,
    host: process.env.HOST,
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  // external plugin
  await server.register([
    {
      plugin: Jwt,
    },
  ]);

  // jwt strategy for authentication
  server.auth.strategy('openmusic_jwt', 'jwt', {
    keys: process.env.ACCESS_TOKEN_KEY,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      maxAgeSec: process.env.ACCESS_TOKEN_AGE,
    },
    validate: (artifacts) => ({
      isValid: true,
      credentials: {
        id: artifacts.decoded.payload.id,
      },
    }),
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
    {
      plugin: authentications,
      options: {
        authenticationsService,
        usersService: userService,
        tokenManager: TokenManager,
        validator: AuthenticationsValidator,
      },
    },
    {
      plugin: playlists,
      options: {
        service: playlistsService,
        validator: PlaylistsValidator,
      },
    },
    {
      plugin: collaborations,
      options: {
        collaborationsService,
        playlistsService,
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
      const { statusCode, payload } = response.output;
      if (statusCode === 401) {
        return h.response(payload).code(401);
      }

      const newResponse = h.response({
        status: 'error',
        message: 'Something wrong with server',
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

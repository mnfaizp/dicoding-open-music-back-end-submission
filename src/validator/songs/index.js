const { SongPayloadSchema } = require('./schema');
const InvariantError = require('../../exceptions/InvariantError');

const SongsValidator = {
  validateSongPayload: (payload) => {
    const songValidationResult = SongPayloadSchema.validate(payload);
    if (songValidationResult.error) {
      throw new InvariantError(songValidationResult.error.message);
    }
  },
};

module.exports = SongsValidator;

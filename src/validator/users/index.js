const { UserPayloadSchema } = require('./schema');
const InvariantError = require('../../exceptions/InvariantError');

const UsersValidator = {
  validateUserPayload: (payload) => {
    const userValidationResult = UserPayloadSchema.validate(payload);
    if (userValidationResult.error) {
      throw new InvariantError(userValidationResult.error.message);
    }
  },
};

module.exports = UsersValidator;

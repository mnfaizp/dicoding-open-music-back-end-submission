const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const bcrypt = require('bcrypt');
const InvariantError = require('../../exceptions/InvariantError');
const AuthenticationError = require('../../exceptions/AuthenticationError');

class UsersService {
  constructor() {
    this.pool = new Pool();
  }

  async addUser({ username, password, fullname }) {
    await this.verifyExistingUsername(username);

    const id = `user-${nanoid(16)}`;
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = {
      text: 'INSERT INTO users VALUES ($1, $2, $3, $4) RETURNING id',
      values: [id, username, hashedPassword, fullname],
    };

    const result = await this.pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('User failed to be added');
    }

    return result.rows[0].id;
  }

  async verifyExistingUsername(username) {
    const query = { text: 'SELECT username FROM users WHERE username = $1', values: [username] };
    const result = await this.pool.query(query);

    if (result.rowCount > 0) {
      throw new InvariantError('User already exists. Username have been used');
    }
  }

  async verifyUserCredential(username, password) {
    const query = { text: 'SELECT id, password FROM users WHERE username = $1', values: [username] };

    const result = await this.pool.query(query);

    if (!result.rowCount) {
      throw new AuthenticationError('There\'s no user with the given username');
    }

    const { id, password: hashedPassword } = result.rows[0];

    const match = await bcrypt.compare(password, hashedPassword);

    if (!match) {
      throw new AuthenticationError('Wrong Credential!');
    }

    return id;
  }
}

module.exports = UsersService;

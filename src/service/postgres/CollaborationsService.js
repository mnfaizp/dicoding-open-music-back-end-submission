const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');

class CollaborationsService {
  constructor() {
    this.pool = new Pool();
  }

  async addCollaboration(playlistId, userId) {
    const id = `collab-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO collaborations VALUES ($1, $2, $3) RETURNING id',
      values: [id, playlistId, userId],
    };

    const result = await this.pool.query(query);

    if (!result.rowCount) {
      throw InvariantError('Failed to add collaboration to playlist');
    }

    return result.rows[0].id;
  }

  async deleteCollaboration(playlistId, userId) {
    const query = {
      text: 'DELETE FROM collaborations WHERE playlist_id = $1 AND user_id = $2',
      values: [playlistId, userId],
    };

    const result = await this.pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('Failed to delete collaboration');
    }
  }

  async verifyCollaboration(playlistId, userId) {
    const query = {
      text: 'SELECT * FROM collaborations WHERE user_id = $1 AND playlist_id = $2',
      values: [userId, playlistId],
    };

    const result = await this.pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('Failed to verify collaboration');
    }
  }
}

module.exports = CollaborationsService;

const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');
const InvariantError = require('../../exceptions/InvariantError');

class PlaylistsService {
  constructor(collaborationsService) {
    this.pool = new Pool();
    this.collaborationsService = collaborationsService;
  }

  async addPlaylist({ name, owner }) {
    const playlistId = `playlist-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO playlists VALUES ($1, $2, $3) RETURNING id',
      values: [playlistId, name, owner],
    };

    const result = await this.pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('Failed to add playlist');
    }

    return result.rows[0].id;
  }

  async getPlaylists(userId) {
    const query = {
      text: 'SELECT playlists.id, playlists.name, users.username FROM playlists INNER JOIN users ON playlists.owner = users.id LEFT JOIN collaborations ON collaborations.playlist_id = playlists.id WHERE playlists.owner = $1 OR collaborations.user_id = $1 GROUP BY playlists.id, users.username',
      values: [userId],
    };
    const result = await this.pool.query(query);
    return result.rows;
  }

  async deletePlaylistsById(playlistId) {
    const query = {
      text: 'DELETE FROM playlists WHERE id = $1',
      values: [playlistId],
    };
    await this.pool.query(query);
  }

  async verifyPlaylistsOwner({ id, owner }) {
    const query = {
      text: 'SELECT id, owner FROM playlists WHERE id = $1',
      values: [id],
    };

    const result = await this.pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('No playlists with such id');
    }

    const userId = result.rows[0].owner;

    if (userId !== owner) {
      throw new AuthorizationError('You\'re not allowed to access this resource');
    }
  }

  async addSongToPlaylists({ playlistId, songId }) {
    const id = nanoid(16);
    const query = {
      text: 'INSERT INTO playlistssongs VALUES($1, $2, $3) RETURNING id',
      values: [id, playlistId, songId],
    };
    const result = await this.pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('Song failed added to playlist');
    }
  }

  async getSongsByPlaylistId(id) {
    const query = {
      text: 'select songs.id, songs.title, songs.performer from songs join playlistssongs on songs.id = playlistssongs.song_id where playlistssongs.playlist_id = $1', values: [id],
    };
    const result = await this.pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('No playlists with such id');
    }

    return result.rows;
  }

  async deleteSongFromPlaylist(playlistId, songId) {
    const query = {
      text: 'DELETE FROM playlistssongs WHERE playlist_id = $1 AND song_id = $2 RETURNING id',
      values: [playlistId, songId],
    };

    const result = await this.pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('No song with such id');
    }
  }

  async verifyPlaylistsAccess(playlistId, userId) {
    try {
      await this.verifyPlaylistsOwner({ id: playlistId, owner: userId });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      try {
        await this.collaborationsService.verifyCollaboration(playlistId, userId);
      } catch {
        throw error;
      }
    }
  }
}

module.exports = PlaylistsService;

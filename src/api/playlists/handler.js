class PlaylistsHandler {
  constructor(service, validator) {
    this.service = service;
    this.validator = validator;

    this.postPlaylistHandler = this.postPlaylistHandler.bind(this);
    this.getPlaylistsHandler = this.getPlaylistsHandler.bind(this);
    this.deletePlaylistsByIdHandler = this.deletePlaylistsByIdHandler.bind(this);
    this.postSongToPlaylistHandler = this.postSongToPlaylistHandler.bind(this);
    this.getSongsInPlaylistHandler = this.getSongsInPlaylistHandler.bind(this);
    this.deleteSongInPlaylistHandler = this.deleteSongInPlaylistHandler.bind(this);
  }

  async postPlaylistHandler(request, h) {
    this.validator.validatePostPlaylistPayload(request.payload);
    const { name } = request.payload;
    const owner = request.auth.credentials.id;

    const playlistId = await this.service.addPlaylist({ name, owner });

    const response = h.response({
      status: 'success',
      message: 'Playlist added successfully',
      data: { playlistId },
    });
    response.code(201);
    return response;
  }

  async getPlaylistsHandler(request) {
    const { id: credentialId } = request.auth.credentials;
    const playlists = await this.service.getPlaylists(credentialId);
    return {
      status: 'success',
      data: {
        playlists,
      },
    };
  }

  async deletePlaylistsByIdHandler(request) {
    const { id: credentialId } = request.auth.credentials;
    const { playlistId } = request.params;

    await this.service.verifyPlaylistsOwner({ id: playlistId, owner: credentialId });
    await this.service.deletePlaylistsById(playlistId);

    return { status: 'success', message: 'Playlists deleted successfully' };
  }

  async postSongToPlaylistHandler(request, h) {
    this.validator.validatePostSongToPlaylistPayload(request.payload);
    const { songId } = request.payload;
    const { playlistId } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this.service.verifyPlaylistsAccess(playlistId, credentialId);

    await this.service.addSongToPlaylists({ playlistId, songId });

    const response = h.response({
      status: 'success',
      message: 'Song addend to playlist',
    });
    response.code(201);
    return response;
  }

  async getSongsInPlaylistHandler(request) {
    const { id: credentialId } = request.auth.credentials;
    const { playlistId } = request.params;

    await this.service.verifyPlaylistsAccess(playlistId, credentialId);
    const songs = await this.service.getSongsByPlaylistId(playlistId);
    return {
      status: 'success',
      data: { songs },
    };
  }

  async deleteSongInPlaylistHandler(request) {
    this.validator.validateDeleteSongInPlaylistPayloadSchema(request.payload);
    const { id: credentialId } = request.auth.credentials;
    const { playlistId } = request.params;
    const { songId } = request.payload;

    await this.service.verifyPlaylistsAccess(playlistId, credentialId);
    await this.service.deleteSongFromPlaylist(playlistId, songId);

    return {
      status: 'success',
      message: 'Song have been deleted successfully',
    };
  }
}

module.exports = PlaylistsHandler;

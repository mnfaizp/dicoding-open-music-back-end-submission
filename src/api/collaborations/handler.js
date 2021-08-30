class CollaborationsHandler {
  constructor(collaborationsService, playlistsService) {
    this.collaborationsService = collaborationsService;
    this.playlistsService = playlistsService;

    this.postCollaborationHandler = this.postCollaborationHandler.bind(this);
    this.deleteCollaborationHandler = this.deleteCollaborationHandler.bind(this);
  }

  async postCollaborationHandler(request, h) {
    const { playlistId, userId } = request.payload;
    const { id: credentialId } = request.auth.credentials;

    await this.playlistsService.verifyPlaylistsOwner({ id: playlistId, owner: credentialId });
    await this.collaborationsService.addCollaboration(playlistId, userId);

    const response = h.response({
      status: 'success',
      message: 'Collaboration added successfully',
    });
    response.code(201);
    return response;
  }

  async deleteCollaborationHandler(request) {
    const { playlistId, userId } = request.payload;
    const { id: credentialId } = request.auth.credentials;

    await this.playlistsService.verifyPlaylistsOwner({ id: playlistId, owner: credentialId });
    await this.collaborationsService.deleteCollaboration(playlistId, userId);

    return {
      status: 'success',
      message: 'Collaboration deleted successfully',
    };
  }
}

module.exports = CollaborationsHandler;

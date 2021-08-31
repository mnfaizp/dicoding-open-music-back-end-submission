/* eslint-disable camelcase */

exports.up = (pgm) => {
  pgm.createTable('playlistssongs', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    playlist_id: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
    song_id: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
  });

  pgm.addConstraint('playlistssongs', 'fk_playlistssongs.song_id_songs.id', 'FOREIGN KEY(song_id) REFERENCES songs(id) ON DELETE CASCADE');
  pgm.addConstraint('playlistssongs', 'fk_playlistssongs.playlist_id_songs.id', 'FOREIGN KEY(playlist_id) REFERENCES playlists(id) ON DELETE CASCADE');

  pgm.addConstraint('playlistssongs', 'unique_song_id_and_playlist_id', 'UNIQUE(song_id, playlist_id)');
};

exports.down = (pgm) => {
  pgm.createTable('playlistsSongs');
};

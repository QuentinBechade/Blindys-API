import { PrismaClient } from '@prisma/client';
import * as https from 'https';

const prisma = new PrismaClient();

const getAccessToken = async () => {
  const clientId = '98b28229eb804c5f92211f35516a7e3c';
  const clientSecret = 'a0ecf390e2dd4ef5a73036ddbb5e9629';
  const payload = `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`;

  const options = {
    hostname: 'accounts.spotify.com',
    path: '/api/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const token = JSON.parse(data).access_token;
          resolve(token);
        } catch (parseError) {
          reject(parseError);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(payload);
    req.end();
  });
};

const searchPlaylistId = async (token, playlistName) => {
  const params = new URLSearchParams({
    q: playlistName,
    type: 'playlist',
    limit: '1',
  });

  const options = {
    hostname: 'api.spotify.com',
    path: `/v1/search?${params.toString()}`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve(JSON.parse(data));
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
};

const searchPlaylist = async (token, playlistId) => {
  const options = {
    hostname: 'api.spotify.com',
    path: `/v1/playlists/${playlistId}`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve(JSON.parse(data));
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
};

const main = async () => {
  try {
    // Obtenez le token
    const accessToken = await getAccessToken();

    const playlistNames = [
      'Pop mix',
      'Rock',
      'Années 80',
      'Années 90',
      'Musique de film',
      'Jazz',
      'R&B',
      'Country',
      'Dubstep',
      'Hip-Hop',
      'Rap',
      'Rap Francais',
      'Rap US',
      'Beurette à chicha',
      'Funk',
      'Années 2000',
      'Afrotrap',
      'Bachata',
      'Latino',
      'Dua Lipa',
    ];

    for (const themeOnly of playlistNames) {
      // Effectuez la recherche de la playlist
      const resultPlaylistId = await searchPlaylistId(accessToken, themeOnly);

      for (const playlistInfo of resultPlaylistId.playlists?.items || []) {
        const playlistId = playlistInfo?.id;
        console.log(playlistId);

        const resultPlaylist = await searchPlaylist(
          accessToken,
          playlistId?.toString() || '',
        );

        // Loop through each track in the playlist
        for (const trackInfo of resultPlaylist.tracks?.items || []) {
          // Get the track information
          const trackId = trackInfo.track?.id;
          const trackName = trackInfo.track?.name;
          const trackArtist = trackInfo.track?.artists?.[0]?.name;
          const previewUrl = trackInfo.track?.preview_url;
          const imageUrl = trackInfo.track?.album?.images?.[0]?.url;

          if (previewUrl) {
            // Utilisez le client Prisma pour insérer dans la base de données
            await prisma.track.create({
              data: {
                track_id: trackId || '',
                name: trackName || '',
                artist: trackArtist || '',
                preview_url: previewUrl || '',
                image_url: imageUrl || '',
                theme: themeOnly || '',
              },
            });

            console.log(`Nom de la piste: ${trackName}`);
            console.log(`Artiste: ${trackArtist}`);
            console.log(`ID Spotify: ${trackId}`);
            console.log(`URL de prévisualisation: ${previewUrl}`);
            console.log(`URL de l'image: ${imageUrl}`);
            console.log('\n');
          }
        }
      }
    }
  } catch (error) {
    console.error("Une erreur s'est produite :", error);
  } finally {
    // Fermez la connexion Prisma à la fin
    await prisma.$disconnect();
  }
};

// Appelez la fonction principale
main();

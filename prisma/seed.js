//import https from "https";

const { PrismaClient } = require('@prisma/client');
//import { getAccessToken } from '../src/utils/access_token'; // Assurez-vous d'ajuster le chemin du fichier access_token
//import { searchPlaylistId, searchPlaylist } from '../src/utils/requests';
const {URLSearchParams} = require('url'); // Assurez-vous d'ajuster le chemin du fichier requests
const {https} = require('https');

// Initialisez le client Prisma
const prisma = new PrismaClient();

function getAccessToken() {
    const options = {
        hostname: 'accounts.spotify.com',
        path: '/api/token',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    };

    const clientId = '98b28229eb804c5f92211f35516a7e3c';
    const clientSecret = 'a0ecf390e2dd4ef5a73036ddbb5e9629';
    const payload = 'grant_type=client_credentials&client_id=' + clientId + '&client_secret=' + clientSecret;

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                const token = JSON.parse(data)['access_token'];
                resolve(token);
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(payload);
        req.end();
    });
}

function searchPlaylistId(token, playlistName) {
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
            'Authorization': `Bearer ${token}`,
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
}

function searchPlaylist(token, playlistId) {
    const options = {
        hostname: 'api.spotify.com',
        path: `/v1/playlists/${playlistId}`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
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
}

// Obtenez le token
const accessToken = getAccessToken();

const playlistNames = [
    "Pop mix", "Rock", "Années 80", "Années 90", "Musique de film", "Jazz", "R&B", "Country", "Dubstep",
    "Hip-Hop", "Rap", "Rap Francais", "Rap US", "Beurette à chicha", "Funk", "Années 2000", "Afrotrap",
    "Bachata", "Latino", "Dua Lipa"
];

for (const themeOnly of playlistNames) {
    // Effectuez la recherche de la playlist
    const resultPlaylistId = searchPlaylistId(accessToken.toString(), themeOnly);

    for (const playlistInfo of resultPlaylistId.playlists?.items || []) {
        const playlistId = playlistInfo?.id;
        console.log(playlistId);

        const resultPlaylist = searchPlaylist(accessToken.toString(), playlistId?.toString() || '');

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
                prisma.track.create({
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
                console.log("\n");
            }
        }
    }
}


import { PrismaClient } from '@prisma/client';
import { getAccessToken } from '../src/access_token'; // Assurez-vous d'ajuster le chemin du fichier access_token
import { searchPlaylistId, searchPlaylist } from '../src/requests'; // Assurez-vous d'ajuster le chemin du fichier requests

// Obtenez le token
const accessToken = getAccessToken();

// Initialisez le client Prisma
const prisma = new PrismaClient();

const playlistNames: string[] = [
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

// N'oubliez pas de fermer la connexion Prisma à la fin de votre script
prisma.$disconnect();

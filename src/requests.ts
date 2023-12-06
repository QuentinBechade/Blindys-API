import * as https from 'https';
import { URLSearchParams } from 'url';
import { getAccessToken } from './access_token';

// Fonction pour effectuer la requête GET playlist_id avec le token
export function searchPlaylistId(token: string, playlistName: string): any {
    const params = new URLSearchParams({
        q: playlistName,
        type: 'playlist',
        limit: '1',
    });

    const options: https.RequestOptions = {
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

// Fonction pour effectuer la requête GET playlist avec le token
export function searchPlaylist(token: string, playlistId: string): any {
    const options: https.RequestOptions = {
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

// Fonction pour effectuer la requête GET track avec le token
export async function searchTrack(token: string, trackName: string): Promise<any> {
    const params = new URLSearchParams({
        q: trackName,
        type: 'track',
        limit: '1',
    });

    const options: https.RequestOptions = {
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

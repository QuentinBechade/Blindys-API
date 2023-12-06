/*import * as https from 'https';

// Fonction pour obtenir le token à partir de la requête POST
export async function getAccessToken(): Promise<string> {
    const options: https.RequestOptions = {
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

// Exemple d'utilisation de la fonction
getAccessToken().then((token) => {
    console.log('Access Token:', token);
}).catch((error) => {
    console.error('Error:', error);
});
*/
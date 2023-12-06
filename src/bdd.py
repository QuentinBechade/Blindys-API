from prisma import PrismaClient
from access_token import get_access_token
from requests import search_playlist_id, search_playlist
import sqlite3

# Obtenez le token
access_token = get_access_token()

# Initialisez le client Prisma
prisma = PrismaClient()

playlist_name = ["Pop mix", "Rock", "Années 80", "Années 90", "Musique de film", "Jazz", "R&B", "Country", "Dubstep",
                 "Hip-Hop", "Rap", "Rap Francais", "Rap US", "Beurette à chicha", "Funk", "Années 2000", "Afrotrap",
                 "Bachata", "Latino", "Dua Lipa"]

for theme_only in playlist_name:
    # Effectuez la recherche de la playlist
    result_playlist_id = search_playlist_id(access_token, theme_only)

    for playlist_info in result_playlist_id.get("playlists", {}).get("items", []):
        playlist_id = playlist_info.get("id")
    print(playlist_id)

    result_playlist = search_playlist(access_token, str(playlist_id))

    # Connect to the database
    conn = sqlite3.connect("spotify_tracks.db")
    cursor = conn.cursor()

    # Create the table if it doesn't exist
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tracks (
            track_id TEXT PRIMARY KEY,
            name TEXT,
            artist TEXT,
            preview_url TEXT,
            image_url TEXT,
            theme TEXT
        )
    ''')

    # Loop through each track in the playlist
    for track_info in result_playlist.get("tracks", {}).get("items", []):
        # Get the track information
        track_id = track_info.get("track", {}).get("id")
        track_name = track_info.get("track", {}).get("name")
        track_artist = track_info.get("track", {}).get("artists", [{}])[0].get("name")
        preview_url = track_info.get("track", {}).get("preview_url")
        image_url = track_info.get("track", {}).get("album", {}).get("images", [{}])[0].get("url")

        if preview_url is not None:
            # Utilisez le client Prisma pour insérer ou mettre à jour la base de données
            prisma.track.upsert(
                where={"track_id": track_id},
                create={"name": track_name, "artist": track_artist, "preview_url": preview_url,
                        "image_url": image_url, "theme": theme_only},
                update={"name": track_name, "artist": track_artist, "preview_url": preview_url,
                        "image_url": image_url, "theme": theme_only},
            )

            print(f"Nom de la piste: {track_name}")
            print(f"Artiste: {track_artist}")
            print(f"ID Spotify: {track_id}")
            print(f"URL de prévisualisation: {preview_url}")
            print(f"URL de l'image: {image_url}")
            print("\n")

    # Commit the changes to the database
    conn.commit()

    # Close the connection to the database
    conn.close()

# Fermez la connexion à la base de données Prisma
prisma.disconnect()

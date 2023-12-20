from prisma import Prisma
from access_token import get_access_token
from requests import search_playlist_id, search_playlist
import sqlite3

# Obtenez le token
access_token = get_access_token()

playlist_name = ["Pop mix", "Rock", "Années 80", "Années 90", "Musique de film", "Jazz", "R&B", "Country", "Dubstep",
                 "Hip-Hop", "Rap", "Rap Francais", "Rap US", "Beurette à chicha", "Funk", "Années 2000", "Afrotrap",
                 "Bachata", "Latino", "Dua Lipa"]

for theme_only in playlist_name:
    #Effectuer la recherche de la playlist
    result_playlist_id=search_playlist_id(access_token,theme_only)

    for playlist_info in result_playlist_id.get("playlists", {}).get("items", []):
        playlist_id = playlist_info.get("id")
    print(playlist_id)

    result_playlist=search_playlist(access_token,str(playlist_id))

    # Le nom de la piste que vous souhaitez rechercher
    #track_name = input("Entrez le nom de la piste à rechercher: ")

    # Effectuez la recherche de la piste avec le token
    #result = search_track(access_token, track_name)

    print("Résultats de la recherche:")

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
            # Insert or replace the information in the database
            cursor.execute('''
                INSERT OR REPLACE INTO tracks (track_id, name, artist, preview_url, image_url, theme)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (track_id, track_name, track_artist, preview_url, image_url,theme_only))

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
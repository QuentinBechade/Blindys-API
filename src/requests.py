import http.client
import json
from urllib.parse import quote
import sqlite3

# Fonction pour effectuer la requête GET playlist_id avec le token
def search_playlist_id(token, playlist_name):
    conn = http.client.HTTPSConnection("api.spotify.com")
    headers = {"Authorization": f"Bearer {token}"}
   
    # Encode le paramètre de requête "q"
    encoded_playslist_name = quote(playlist_name, safe='')

    params = f"q={encoded_playslist_name}&type=playlist&limit=1"

    conn.request("GET", f"/v1/search?{params}", headers=headers)
    res = conn.getresponse()
    data = res.read()
    return json.loads(data.decode("utf-8"))

# Fonction pour effectuer la requête GET track avec le token
def search_playlist(token, playlist_id):
    conn = http.client.HTTPSConnection("api.spotify.com")
    headers = {"Authorization": f"Bearer {token}"}
    conn.request("GET", f"/v1/playlists/{playlist_id}", headers=headers)
    res = conn.getresponse()
    data = res.read()
    return json.loads(data.decode("utf-8"))

# Fonction pour effectuer la requête GET track avec le token
def search_track(token, track_name):
    conn = http.client.HTTPSConnection("api.spotify.com")
    headers = {"Authorization": f"Bearer {token}"}
   
    # Encode le paramètre de requête "q"
    encoded_track_name = quote(track_name, safe='')

    params = f"q={encoded_track_name}&type=track&limit=1"

    conn.request("GET", f"/v1/search?{params}", headers=headers)
    res = conn.getresponse()
    data = res.read()
    return json.loads(data.decode("utf-8"))


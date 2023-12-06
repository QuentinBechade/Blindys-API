import http.client
import json
from urllib.parse import quote

#Fonction pour obtenir le token à partir de la requête POST
def get_access_token():
    conn = http.client.HTTPSConnection("accounts.spotify.com")
    payload = "grant_type=client_credentials&client_id=98b28229eb804c5f92211f35516a7e3c&client_secret=a0ecf390e2dd4ef5a73036ddbb5e9629"
    headers = {"Content-Type": "application/x-www-form-urlencoded"}

    conn.request("POST", "/api/token", payload, headers)
    res = conn.getresponse()
    data = res.read()
    token = json.loads(data.decode("utf-8"))["access_token"]
    return token
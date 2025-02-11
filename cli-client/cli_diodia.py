from typing import Annotated, Optional
import typer
from rich import print
import requests
import urllib.parse
import json
import os
import functools

# Βασικές ρυθμίσεις
API_URL = "http://localhost:9115/api"  # Base URL του API
CONFIG_FILE = "cli_config.json"         # Αρχείο τοπικής αποθήκευσης διαπιστευτηρίων (π.χ. API key)

# Βοηθητικές συναρτήσεις για τοπική αποθήκευση (config)
def load_config(key: str) -> Optional[str]:
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, "r") as f:
            config = json.load(f)
        return config.get(key)
    else:
        return None

def store_config(key: str, value: Optional[str]):
    config = {}
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, "r") as f:
            config = json.load(f)
    config[key] = value
    with open(CONFIG_FILE, "w") as f:
        json.dump(config, f)

# Διακοσμητής για έλεγχο διαπίστευσης
def authenticated(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        api_key = load_config("api_key")  # ✅ Load API Key
        if not api_key:
            print(":warning: [bold red]Authentication required. Please login first.[/bold red]")
            raise typer.Exit()

        # ✅ Only add _api_key if it doesn't already exist
        if "_api_key" not in kwargs or kwargs["_api_key"] is None:
            kwargs["_api_key"] = api_key

        return func(*args, **kwargs)

    return wrapper


# Βοηθητική συνάρτηση για την εκτέλεση αιτήσεων HTTP
def handle_request(endpoint: str, method: str = "GET", api_key: Optional[str] = None, 
                   params: dict = None, json_data: dict = None, files: dict = None):
    if api_key is None:  # ✅ Load API key if missing
        api_key = load_config("api_key")

    headers = {}
    if api_key:
        headers["X-OBSERVATORY-AUTH"] = api_key  # ✅ Send API Key

    print(f"🔍 Debug: API Key Used: {api_key}")  # Debugging line
    print(f"🔍 Sending request to: {API_URL + endpoint}")  # Debugging line

    url = API_URL + endpoint
    try:
        if method.upper() == "GET":
            response = requests.get(url, headers=headers, params=params)
        elif method.upper() == "POST":
            response = requests.post(url, headers=headers, data=params, json=json_data, files=files)
        else:
            print(f":no_entry: [bold red]Method {method} not implemented.[/bold red]")
            return None
    except requests.ConnectionError:
        print(":cross_mark: [bold red]Server connection error.[/bold red]")
        return None

    print(f"🔍 Received status code: {response.status_code}")  # Debugging line

    if response.status_code == 401:
        print(":no_entry: [bold red]Unauthorized. API key might be missing or invalid.[/bold red]")

    if response.status_code in [200, 204]:
        return response
    else:
        print(f":no_entry: [bold red]Request failed with status code {response.status_code}.[/bold red]")
        return None


# Βοηθητική συνάρτηση για εμφάνιση αποτελεσμάτων σε JSON ή CSV
def print_response(response, format: str = "json", found_msg: str = "", empty_msg: str = ""):
    if response is None:
        print(empty_msg)
        return
    if format.lower() == "json":
        try:
            data = response.json()
            print(found_msg)
            print(data)
        except Exception:
            print(":no_entry: [bold red]Error parsing JSON.[/bold red]")
    elif format.lower() == "csv":
        print(found_msg)
        print(response.text)
    else:
        print(":no_entry: [bold red]Unknown format.[/bold red]")

# Δημιουργία του Typer app
app = typer.Typer(help="CLI manager for Toll Management System")

####################################
# Λειτουργίες διαπίστευσης (login, logout)
####################################
@app.command()
def login(
    username: Annotated[str, typer.Option(help="Username", show_default=False)],
    passw: Annotated[str, typer.Option(help="Password", show_default=False)]
):
    """Logs in and stores token to local storage."""
    store_config("api_key", None)
    try:
        response = requests.post(
            API_URL + "/login",
            data={'username': username, 'password': passw},
            headers={'content-type': 'application/x-www-form-urlencoded'}
        )
        if response.status_code == 200:
            json_resp = response.json()
            if "token" in json_resp:
                store_config("api_key", json_resp["token"])
                print(":white_check_mark: [bold green]Successfully authenticated.[/bold green]")
            else:
                print(":no_good: [bold red]No token in response.[/bold red]")
        elif response.status_code == 401:
            print(":stop_sign: [bold red]Authentication failed (wrong credentials).[/bold red]")
        else:
            print(":no_good: [bold red]Unexpected status code.[/bold red]")
    except Exception as e:
        print(f":no_good: [bold red]Error: {e}[/bold red]")

@app.command()
#@authenticated
def logout(_api_key: str = None):
    """Logs out and deletes token from local storage."""
    try:
        response = requests.post(
            API_URL + "/logout",
            headers={"X-OBSERVATORY-AUTH": _api_key}
        )
        if response.status_code == 200:
            print(":white_check_mark: [bold green]Successfully logged out.[/bold green]")
        else:
            print(":no_good: [bold red]Logout failed.[/bold red]")
    except Exception as e:
        print(f":cross_mark: [bold red]Error: {e}[/bold red]")
    store_config("api_key", None)

####################################
# Λειτουργίες βασικών endpoints
####################################
@app.command()
#@authenticated
def tollstationpasses(
    station: Annotated[str, typer.Option(help="Toll station ID")],
    from_date: Annotated[str, typer.Option("--from", help="Start date (YYYYMMDD)")],
    to_date: Annotated[str, typer.Option("--to", help="End date (YYYYMMDD)")],
    format: Annotated[str, typer.Option(help="Output format (json or csv)", show_default=True)] = "json",
    _api_key: str = None
):
    """Retrieves toll station passes."""
    params = {"format": format}
    endpoint = f"/tollStationPasses/{urllib.parse.quote(station)}/{from_date}/{to_date}"
    response = handle_request(endpoint, method="GET", api_key=_api_key, params=params)
    print_response(response, format=format, found_msg=":white_check_mark: [bold green]Toll station passes:[/bold green]")

@app.command()
#@authenticated
def passanalysis(
    stationop: Annotated[str, typer.Option(help="Station operator ID")],
    tagop: Annotated[str, typer.Option(help="Tag operator ID")],
    from_date: Annotated[str, typer.Option("--from", help="Start date (YYYYMMDD)")],
    to_date: Annotated[str, typer.Option("--to", help="End date (YYYYMMDD)")],
    format: Annotated[str, typer.Option(help="Output format (json or csv)", show_default=True)] = "json",
    _api_key: str = None
):
    """Retrieves pass analysis between operators."""
    params = {"format": format}
    endpoint = f"/passAnalysis/{urllib.parse.quote(stationop)}/{urllib.parse.quote(tagop)}/{from_date}/{to_date}"
    response = handle_request(endpoint, method="GET", api_key=_api_key, params=params)
    print_response(response, format=format, found_msg=":white_check_mark: [bold green]Pass analysis:[/bold green]")

@app.command()
#@authenticated
def passescost(
    stationop: Annotated[str, typer.Option(help="Toll operator ID")],
    tagop: Annotated[str, typer.Option(help="Tag operator ID")],
    from_date: Annotated[str, typer.Option("--from", help="Start date (YYYYMMDD)")],
    to_date: Annotated[str, typer.Option("--to", help="End date (YYYYMMDD)")],
    format: Annotated[str, typer.Option(help="Output format (json or csv)", show_default=True)] = "json",
    _api_key: str = None
):
    """Retrieves the cost of passes between operators."""
    params = {"format": format}
    endpoint = f"/passesCost/{urllib.parse.quote(stationop)}/{urllib.parse.quote(tagop)}/{from_date}/{to_date}"
    response = handle_request(endpoint, method="GET", api_key=_api_key, params=params)
    print_response(response, format=format, found_msg=":white_check_mark: [bold green]Passes cost:[/bold green]")

@app.command()
#@authenticated
def chargesby(
    opid: Annotated[str, typer.Option(help="Toll operator ID")],
    from_date: Annotated[str, typer.Option("--from", help="Start date (YYYYMMDD)")],
    to_date: Annotated[str, typer.Option("--to", help="End date (YYYYMMDD)")],
    format: Annotated[str, typer.Option(help="Output format (json or csv)", show_default=True)] = "json",
    _api_key: str = None
):
    """Retrieves charges from other operators."""
    params = {"format": format}
    endpoint = f"/chargesBy/{urllib.parse.quote(opid)}/{from_date}/{to_date}"
    response = handle_request(endpoint, method="GET", api_key=_api_key, params=params)
    print_response(response, format=format, found_msg=":white_check_mark: [bold green]Charges by other operators:[/bold green]")

####################################
# Λειτουργίες διαχειριστικών endpoints
####################################
@app.command()
@authenticated
def healthcheck(
    format: Annotated[str, typer.Option(help="Output format (json or csv)", show_default=True)] = "json",
    _api_key: str = None
):
    """Checks the health of the system."""
    params = {"format": format}
    endpoint = "/admin/healthcheck"
    response = handle_request(endpoint, method="GET", api_key=_api_key, params=params)
    print_response(response, format=format, found_msg=":white_check_mark: [bold green]Healthcheck result:[/bold green]")

@app.command()
#@authenticated
def resetstations(
    format: Annotated[str, typer.Option(help="Output format (json or csv)", show_default=True)] = "json",
    _api_key: str = None
):
    """Resets toll stations to initial state."""
    params = {"format": format}
    endpoint = "/admin/resetstations"
    response = handle_request(endpoint, method="POST", api_key=_api_key, params=params)
    print_response(response, format=format, found_msg=":white_check_mark: [bold green]Reset stations result:[/bold green]")

@app.command()
#@authenticated
def resetpasses(
    format: Annotated[str, typer.Option(help="Output format (json or csv)", show_default=True)] = "json",
    _api_key: str = None
):
    """Resets pass events (deletes all pass records)."""
    params = {"format": format}
    endpoint = "/admin/resetpasses"
    response = handle_request(endpoint, method="POST", api_key=_api_key, params=params)
    print_response(response, format=format, found_msg=":white_check_mark: [bold green]Reset passes result:[/bold green]")

@app.command()
#@authenticated
def addpasses(
    source: Annotated[str, typer.Option(help="CSV file with pass events")],
    format: Annotated[str, typer.Option(help="Output format (json or csv)", show_default=True)] = "json",
    _api_key: str = None
):
    """Uploads new pass events from a CSV file."""
    try:
        with open(source, "rb") as f:
            files = {'file': ('passes.csv', f, 'text/csv')}
            params = {"format": format}
            endpoint = "/admin/addpasses"
            response = handle_request(endpoint, method="POST", api_key=_api_key, params=params, files=files)
            print_response(response, format=format, found_msg=":white_check_mark: [bold green]Add passes result:[/bold green]")
    except OSError:
        print(":cross_mark: [bold red]Could not open file.[/bold red]")

if __name__ == '__main__':
    app()

from typing import Annotated, Optional
import typer
from rich import print
import requests
import urllib.parse
import json
import os
import functools

import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Βασικές ρυθμίσεις
API_URL = "https://localhost:9115/api"  # Base URL του API
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
    if api_key is None:
        api_key = load_config("api_key")

    headers = {}
    if api_key:
        headers["secret-key"] = api_key  # Changed from X-OBSERVATORY-AUTH to secret-key

    #print(f"🔍 Debug: API Key Used: {api_key}")
    #print(f"🔍 Debug: Headers:", headers)
    #print(f"🔍 Sending request to: {API_URL + endpoint}")

    url = API_URL + endpoint
    try:
        if method.upper() == "GET":
            response = requests.get(url, headers=headers, params=params, verify=False)
        elif method.upper() == "POST":
            response = requests.post(url, headers=headers, data=params, json=json_data, files=files, verify=False)
        else:
            print(f":no_entry: [bold red]Method {method} not implemented.[/bold red]")
            return None
    except requests.ConnectionError as e:
        print(f":cross_mark: [bold red]Server connection error: {str(e)}[/bold red]")
        return None

    print(f"🔍 Received status code: {response.status_code}")

    if response.status_code == 401:
        print(":no_entry: [bold red]Unauthorized. API key might be missing or invalid.[/bold red]")
        print(":information: Make sure the API key matches the MY_SECRET_KEY in your server's environment variables")

    if response.status_code in [200, 204]:
        return response
    else:
        print(f":no_entry: [bold red]Request failed with status code {response.status_code}.[/bold red]")
        return None

# Βοηθητική συνάρτηση για εμφάνιση αποτελεσμάτων σε JSON ή CSV
# Βοηθητική συνάρτηση για εμφάνιση αποτελεσμάτων σε JSON ή CSV
def print_response(response, format: str = "json", found_msg: str = "", empty_msg: str = ":warning: [bold yellow]No content found![/bold yellow]"):
    if response is None:
        print(empty_msg)
        return
    
    if response.status_code == 204:
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
# Λειτουργίες βασικών endpoints
####################################
@app.command()
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
def resetstations(
    format: Annotated[str, typer.Option(help="Output format (json or csv)", show_default=True)] = "json",
    _api_key: str = None
):
    """Resets toll stations to initial state using the local tollstations2024.csv file."""
    params = {"format": format}
    endpoint = "/admin/resetstations"
    with open("tollstations2024.csv", "rb") as f:
        files = {'file': ('tollstations2024.csv', f, 'text/csv')}
        response = handle_request(endpoint, method="POST", api_key=_api_key, files=files)
    print_response(response, format=format, found_msg=":white_check_mark: [bold green]Reset stations result:[/bold green]")

@app.command()
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
def admin(
    addpasses: Annotated[bool, typer.Option(help="Upload pass events from a CSV file", show_default=False)] = False,
    source: Annotated[Optional[str], typer.Option(help="CSV file with pass events")] = None,
):
    """Admin command with multiple options."""
    if addpasses:
        if not source:
            print(":no_entry: [bold red]Please provide a CSV file using --source.[/bold red]")
            raise typer.Exit()
        addpasses_command(source)

def addpasses_command(source: str, _api_key: str = None):
    """Uploads pass events from a CSV file."""
    try:
        with open(source, "rb") as f:
            files = {'file': ('passes.csv', f, 'text/csv')}
            endpoint = "/admin/addpasses"
            response = handle_request(endpoint, method="POST", api_key=_api_key, files=files)
            if response:
                print(":white_check_mark: [bold green]Pass events uploaded successfully.[/bold green]")
    except OSError:
        print(":cross_mark: [bold red]Could not open file.[/bold red]")

if __name__ == '__main__':
    app()
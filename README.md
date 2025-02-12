# Title
Simple toll aggregation app made for the course of software engineering during the 2024-2025 winter
semester @ ECE/NTUA.

# Dependencies
You can use the database included in this repository inside the back-end folder.
Create a .env file according to the README.md in the afore mentioned folder.
Notes:
You need node.js and npm installed in your system in order to post the server.
You need all the correct node.js modules found under the dependencies tab in the package.json file.
Run "npm init"
Run "npm i cors csv-parser dotenv express fast-csv fs https json2csv multer mysql2 nodemon path"

# Disclaimer
The app is built for academic purposes therefore since it uses an https protocol that requires an ssl certificate, we choose to create a self signed one.
Included in this repository are two file containing a self signed ssl certificate that will, for the usage of this app as a demo, work. Note that this does not satisfy modern web browses security requirements modern browsers will display warning regarding safety concerns.

# Instructions
Download or clone the entire repository and create the dependencies mentioned above. After that navigate to the folder "back-end" and execute the command "node server.js". When the server posts you can use your web browser to access the home page.

# CLI
This app implements a simple cli that can be used to send REST API requests through the terminal/console. In order to make the cli work run the command "pip install --editable ." inside the cli-client directory. For the correct initialization of data through the command line you need to add the mock data .csv files in the same directory as the shell script testing the CLI.




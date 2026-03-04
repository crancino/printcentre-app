# PrintCentre Forge App

A Jira Service Management Forge app for printing requests.

## Features

- Button in JSM request view that opens a modal dialog
- Modal window for print configuration (logic to be implemented)
- Project-scoped display conditions

## Setup

1. Install dependencies:
   \\\
   npm install
   \\\

2. Register the app (first time only):
   \\\
   forge register
   \\\

3. Deploy the app:
   \\\
   forge deploy
   \\\

4. Install the app to your site:
   \\\
   forge install
   \\\

## Development

- To see logs: \orge logs\
- To tunnel for local development: \orge tunnel\

## Structure

- \manifest.yml\ - App configuration and module definitions
- \src/index.js\ - Main application logic
- \package.json\ - Node.js dependencies

## Next Steps

- Implement print logic in the modal
- Add display conditions for specific projects
- Add form fields for print options

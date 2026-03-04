# PrintCentre Forge App - Setup Instructions

## What's Been Created

A basic Jira Service Management Forge app with:
- ✅ A button in JSM request view (Print Request)
- ✅ A modal window that opens when the button is clicked
- ✅ Display conditions to scope to specific projects (currently set to MP project)
- ✅ Basic app structure ready for deployment

## File Structure

\\\
princentre-app/
├── manifest.yml          # App configuration and modules
├── package.json          # Dependencies
├── src/
│   └── index.js         # Main app logic (button + modal)
├── .gitignore
└── README.md
\\\

## Next Steps to Deploy

1. **Install Forge CLI** (if not already installed):
   \\\
   npm install -g @forge/cli
   \\\

2. **Navigate to the app directory**:
   \\\
   cd C:\wamp64\www\forge\princentre-app
   \\\

3. **Install dependencies**:
   \\\
   npm install
   \\\

4. **Login to Forge**:
   \\\
   forge login
   \\\

5. **Register the app** (first time only):
   \\\
   forge register
   \\\
   - This will update the app ID in manifest.yml

6. **Deploy the app**:
   \\\
   forge deploy
   \\\

7. **Install to your Jira site**:
   \\\
   forge install
   \\\
   - Select your Jira site (iitodp.atlassian.net)

8. **View logs**:
   \\\
   forge logs
   \\\

## Testing

Once deployed:
1. Go to a JSM request in the MP project
2. You should see a "Print Request" button in the request view
3. Click the button to open the modal window
4. The modal will display placeholder text for now

## Configuration

- **Add more projects**: Edit \manifest.yml\ and add project keys to the conditions section
- **Customize the modal**: Edit \src/index.js\ to add form fields and logic

## Notes

- The app is currently scoped to the MP project only
- The modal is a placeholder - you'll add print logic later
- The app uses Forge UI Kit for the interface


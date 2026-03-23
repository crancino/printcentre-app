# Registering Forge App to Atlassian Developer Console

## Method 1: Using Forge CLI (Recommended)

The Forge CLI will automatically create the app in the Developer Console for you.

### Steps:

1. **Navigate to your app directory**:
   ```powershell
   cd C:\wamp64\www\forge\princentre-app
   ```

2. **Login to Forge** (if not already logged in):
   ```powershell
   forge login
   ```
   - This will open a browser window
   - Login with your Atlassian account
   - Authorize the Forge CLI

3. **Register the app**:
   ```powershell
   forge register
   ```
   - You'll be prompted to enter an app name (e.g., "PrintCentre App")
   - The CLI will create the app in the Developer Console
   - It will automatically update your manifest.yml with the app ID

4. **Verify registration**:
   - The manifest.yml will be updated with your app ID
   - You can also visit: https://developer.atlassian.com/console/myapps/
   - Your app will appear in the list

---

## Method 2: Manual Registration in Developer Console

If you prefer to create it manually first:

### Steps:

1. **Go to Developer Console**:
   https://developer.atlassian.com/console/myapps/

2. **Create a new app**:
   - Click "Create" → "Create new app"
   - Choose "Forge" as the platform
   - Enter app name: "PrintCentre App"
   - Click "Create"

3. **Get the App ID**:
   - After creating, you'll see the App ID (format: ari:cloud:ecosystem::app/XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX)
   - Copy this ID

4. **Update manifest.yml**:
   - Replace the app ID in manifest.yml:
   ```yaml
   app:
     id: ari:cloud:ecosystem::app/YOUR_COPIED_APP_ID
   ```

5. **Link the CLI to the app**:
   ```powershell
   cd C:\wamp64\www\forge\princentre-app
   forge settings set app YOUR_APP_ID
   ```

---

## Recommended Approach: Use Method 1 (Forge CLI)

It's simpler and less error-prone. The CLI handles everything automatically.

## After Registration

Once registered, you can:
- Deploy: `forge deploy`
- Install: `forge install`
- View in console: https://developer.atlassian.com/console/myapps/


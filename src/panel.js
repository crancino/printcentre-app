export const handler = async (req) => {
  console.log('=== PRINTCENTRE PANEL LOADED ===');
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 15px;
      margin: 0;
      background: white;
    }
    .header {
      font-size: 16px;
      font-weight: 600;
      color: #172b4d;
      margin-bottom: 10px;
    }
    .success {
      padding: 10px;
      background: #e3fcef;
      border-left: 3px solid #00875a;
      border-radius: 3px;
      margin: 10px 0;
      color: #006644;
    }
    button {
      background: #0052cc;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 3px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      margin-top: 10px;
    }
    button:hover {
      background: #0065ff;
    }
  </style>
</head>
<body>
  <div class="header">??? PrintCentre</div>
  <div class="success">? App is loaded and working!</div>
  <p>This panel is visible in both agent and customer portal views.</p>
  <button onclick="alert('Button clicked! Modal will go here.')">Open Print Dialog</button>
  <script>
    console.log('%c??? PrintCentre Panel Loaded', 'color: green; font-size: 14px; font-weight: bold;');
  </script>
</body>
</html>
  `;
  
  return {
    body: html,
    headers: {
      'Content-Type': 'text/html'
    },
    statusCode: 200
  };
};
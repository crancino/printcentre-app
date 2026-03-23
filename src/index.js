export const handler = async (req) => {
  const version = "20260304182045";
  console.log(`=== PRINTCENTRE APP v${version} LOADED ===`);
  
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: sans-serif; padding: 15px; margin: 0; background: white; }
    .header { font-size: 16px; font-weight: 600; margin-bottom: 15px; }
    .info { padding: 12px; background: #deebff; border-left: 3px solid #0052cc; margin: 10px 0; color: #0747a6; }
    button { background: #0052cc; color: white; border: none; padding: 10px 20px; border-radius: 3px; cursor: pointer; width: 100%; margin-top: 10px; font-size: 14px; }
    button:hover { background: #0065ff; }
    .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); align-items: center; justify-content: center; z-index: 99999; }
    .modal.show { display: flex !important; }
    .modal-content { background: white; padding: 24px; border-radius: 3px; max-width: 500px; width: 90%; box-shadow: 0 20px 40px rgba(0,0,0,0.3); }
    .modal-header { font-size: 20px; font-weight: 600; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 2px solid #f4f5f7; }
    .modal-footer { margin-top: 20px; display: flex; gap: 10px; }
    .btn-secondary { background: #f4f5f7; color: #42526e; width: auto; }
  </style>
</head>
<body>
  <div class="header">??? PrintCentre v${version}</div>
  <div class="info">? NEW: Click the button to test modal</div>
  <button id="openModalBtn">Open Print Dialog</button>

  <div id="modal" class="modal">
    <div class="modal-content">
      <div class="modal-header">??? Print Request Configuration</div>
      <p><strong>Success! Modal is working.</strong></p>
      <p>This is where you'll add print options and logic.</p>
      <div class="modal-footer">
        <button id="cancelBtn" class="btn-secondary">Cancel</button>
        <button id="printBtn">Print (Test)</button>
      </div>
    </div>
  </div>

  <script>
    (function() {
      console.log('Script running v${version}');
      
      var modal = document.getElementById('modal');
      var openBtn = document.getElementById('openModalBtn');
      var cancelBtn = document.getElementById('cancelBtn');
      var printBtn = document.getElementById('printBtn');
      
      if (!modal || !openBtn) {
        console.error('Elements not found!');
        return;
      }
      
      openBtn.addEventListener('click', function() {
        console.log('Open button clicked');
        modal.classList.add('show');
      });
      
      cancelBtn.addEventListener('click', function() {
        console.log('Cancel clicked');
        modal.classList.remove('show');
      });
      
      printBtn.addEventListener('click', function() {
        console.log('Print clicked');
        alert('Print functionality will go here!');
        modal.classList.remove('show');
      });
      
      modal.addEventListener('click', function(e) {
        if (e.target === modal) {
          console.log('Clicked outside modal');
          modal.classList.remove('show');
        }
      });
      
      console.log('Event listeners attached successfully');
    })();
  </script>
</body>
</html>`;

  return {
    body: html,
    headers: {
      'Content-Type': ['text/html; charset=utf-8'],
      'Cache-Control': ['no-cache, no-store, must-revalidate']
    },
    statusCode: 200
  };
};
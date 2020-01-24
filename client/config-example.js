var config = {
  // Kiosk installation location, use format all lowercase separated with underscores
  location: 'new_york_city',

  // This is where the client will send translation requests and broadcast its
  // images.
  serverURL: 'https://localhost:4430/',
  
  // WordPress URL
  libraryURL: 'https://localhost:4747/wp-admin/admin-ajax.php?action=fwc_submit_images',

  // Set this to the 'private_key_id' value from service-key.json
  sharedSecret: '...',

  // This will send all non-Baidu traffic through a SOCKS proxy on port 8888
  enableProxy: false,

  bypassList: [
    "*.google.com",
    "*.gstatic.com",
    "firewallcafe.com",
    "*.firewallcafe.com"
  ]
};

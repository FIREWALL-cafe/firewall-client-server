var config = {
  // Kiosk installation location
  // Format: full city name minor abbrs. allowed, all lowercase, separated with underscores
  // Examples: 'new_york_city', 'st_polten', 'ft_lauderdale'
  location: 'unknown',

  // Logo label to use on extension intro screens
  // When adding a new icon, also update `manifest.json.web_accessible_resources`
  // TODO Add a default logo not labeled with "Hong Kong"
  logoLabel: 'default',

  // Translation server URL, can be any other local or remote server endpoint
  serverURL: 'https://babelfish.firewallcafe.com/',
  
  // WordPress server URL, can be any other local or remote server endpoint
  libraryURL: 'https://firewallcafe.com/wp-admin/admin-ajax.php?action=fwc_submit_images',

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

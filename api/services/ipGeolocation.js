const axios = require('axios');

class IPGeolocationService {
  constructor() {
    this.API_URL = 'http://ip-api.com/json/';
  }
  
  async getLocation(ip) {
    // Basic validation
    if (!ip || ip === 'null' || ip === 'undefined') {
      console.log('Invalid IP for geolocation:', ip);
      return null;
    }
    
    // Skip private/local IPs
    if (this.isPrivateIP(ip)) {
      console.log('Skipping private IP:', ip);
      return null;
    }
    
    try {
      console.log('Looking up IP:', ip);
      const response = await axios.get(`${this.API_URL}${ip}`, {
        timeout: 5000 // 5 second timeout
      });
      
      if (response.data.status === 'success') {
        const geoData = {
          country: response.data.country,
          countryCode: response.data.countryCode,
          region: response.data.regionName,
          city: response.data.city,
          latitude: response.data.lat,
          longitude: response.data.lon
        };
        
        console.log(`Geolocation found for ${ip}: ${geoData.city}, ${geoData.country}`);
        return geoData;
      } else {
        console.log('Geolocation failed for IP:', ip, response.data.message);
        return null;
      }
    } catch (error) {
      console.error('IP geolocation error:', error.message);
      return null;
    }
  }
  
  isPrivateIP(ip) {
    return ip.startsWith('10.') || 
           ip.startsWith('172.') || 
           ip.startsWith('192.168.') ||
           ip === '127.0.0.1' ||
           ip === '::1';
  }
}

module.exports = new IPGeolocationService();
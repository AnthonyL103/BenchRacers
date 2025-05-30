
const OPENCAGEKEY = import.meta.env.VITE_OPENCAGEKEY;

export function getLocation() {
    return new Promise<{latitude: number, longitude: number}>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
      } else {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            resolve({ latitude, longitude });
          },
          (error) => {
            reject(error);
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      }
    });
  }
  
  export const getRegionFromCoordinates = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${OPENCAGEKEY}`
      );
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const components = data.results[0].components;
        const region = components.state || 
                      components.province || 
                      components.region || 
                      components.county || 
                      "Unknown";
        
        return region;
      }
      
      return "Unknown";
    } catch (error) {
      console.error("Error getting region:", error);
      return "Unknown"; 
    }
  };
  
  export const getRegionFromIP = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      return data.region || "Unknown";
    } catch (error) {
      console.error("Error getting IP location:", error);
      return "Unknown";
    }
  };
  
  export const getUserRegion = async (): Promise<string> => {
    try {
      const { latitude, longitude } = await getLocation();
      return await getRegionFromCoordinates(latitude, longitude);
    } catch (error) {
      console.log("Geolocation failed, trying IP-based location", error);
      
      return await getRegionFromIP();
    }
  };
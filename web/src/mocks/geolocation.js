export default {
    getCurrentPosition: (success, error, options) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(success, error, options);
        } else {
            console.warn('Geolocation not supported');
        }
    },
    watchPosition: (success, error, options) => {
        if (navigator.geolocation) {
            return navigator.geolocation.watchPosition(success, error, options);
        }
        return null;
    },
    clearWatch: (watchId) => {
        if (navigator.geolocation) {
            navigator.geolocation.clearWatch(watchId);
        }
    },
    stopObserving: () => { }
};

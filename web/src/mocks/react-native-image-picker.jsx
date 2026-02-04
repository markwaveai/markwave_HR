export const launchCamera = (options, callback) => {
    console.log('Mock launchCamera called with options:', options);
    alert('Camera is not supported in this web preview.');
    if (callback) callback({ didCancel: true });
    return Promise.resolve({ didCancel: true });
};

export const launchImageLibrary = (options, callback) => {
    console.log('Mock launchImageLibrary called with options:', options);
    alert('Image Gallery is not supported in this web preview.');
    if (callback) callback({ didCancel: true });
    return Promise.resolve({ didCancel: true });
};

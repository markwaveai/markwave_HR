import { Platform } from 'react-native';

export const getGeolocation = () => {
    if (Platform.OS === 'web') {
        return navigator.geolocation;
    } else {
        return require('@react-native-community/geolocation').default;
    }
};

export const showAlert = (title, message, buttons) => {
    if (Platform.OS === 'web') {
        if (buttons && buttons.length > 0) {
            // Simple confirm for web if there are buttons
            const result = window.confirm(`${title}\n\n${message}`);
            if (result) {
                const okButton = buttons.find(b => b.style !== 'cancel' && b.text !== 'Cancel');
                if (okButton && okButton.onPress) okButton.onPress();
            } else {
                const cancelButton = buttons.find(b => b.style === 'cancel' || b.text === 'Cancel');
                if (cancelButton && cancelButton.onPress) cancelButton.onPress();
            }
        } else {
            window.alert(`${title}\n\n${message}`);
        }
    } else {
        const { Alert } = require('react-native');
        Alert.alert(title, message, buttons);
    }
};

export const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
        try {
            const { PermissionsAndroid } = require('react-native');
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.CAMERA,
                {
                    title: "Camera Permission",
                    message: "App needs access to your camera to take photos.",
                    buttonNeutral: "Ask Me Later",
                    buttonNegative: "Cancel",
                    buttonPositive: "OK"
                }
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        } catch (err) {
            console.warn(err);
            return false;
        }
    }
    return true;
};

import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'wt_token';

export async function getToken() {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (e) {
    console.error('getToken error:', e);
    return null;
  }
}

export async function setToken(token) {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (e) {
    console.error('setToken error:', e);
  }
}

export async function removeToken() {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (e) {
    console.error('removeToken error:', e);
  }
}

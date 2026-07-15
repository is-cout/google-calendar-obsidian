//===================
// Per-account token storage
//===================
// Access tokens and their expiration are cached in localStorage, namespaced by account
// id so multiple connected accounts don't clobber each other. Refresh tokens live in the
// plugin settings (on the GoogleAccount object), not here.

const accessKey = (accountId: string): string => `googleCalendarAccessToken_${accountId}`;
const expirationKey = (accountId: string): string => `googleCalendarExpirationTime_${accountId}`;

//===================
//GETTER
//===================

/**
 * getAccessToken for an account from LocalStorage
 */
export const getAccessToken = (accountId: string): string => {
	return window.localStorage.getItem(accessKey(accountId)) ?? "";
};

/**
 * getExpirationTime for an account from LocalStorage
 */
export const getExpirationTime = (accountId: string): number => {
	const expirationTimeString =
		window.localStorage.getItem(expirationKey(accountId)) ?? "0";
	return parseInt(expirationTimeString, 10);
};

//===================
//SETTER
//===================

/**
 * set AccessToken for an account into LocalStorage
 */
export const setAccessToken = (accountId: string, googleAccessToken: string): void => {
	window.localStorage.setItem(accessKey(accountId), googleAccessToken);
};

/**
 * set ExpirationTime for an account into LocalStorage
 */
export const setExpirationTime = (accountId: string, googleExpirationTime: number): void => {
	if (isNaN(googleExpirationTime)) return;
	window.localStorage.setItem(expirationKey(accountId), googleExpirationTime + "");
};

/**
 * Remove an account's cached tokens (used when the account is disconnected).
 */
export const clearAccountTokens = (accountId: string): void => {
	window.localStorage.removeItem(accessKey(accountId));
	window.localStorage.removeItem(expirationKey(accountId));
};

//===================
// Legacy single-account keys (only read during migration to the accounts model)
//===================

export const getLegacyRefreshToken = (): string =>
	window.localStorage.getItem("googleCalendarRefreshToken") ?? "";

export const getLegacyAccessToken = (): string =>
	window.localStorage.getItem("googleCalendarAccessToken") ?? "";

export const getLegacyExpirationTime = (): number =>
	parseInt(window.localStorage.getItem("googleCalendarExpirationTime") ?? "0", 10);

export const clearLegacyTokens = (): void => {
	window.localStorage.removeItem("googleCalendarRefreshToken");
	window.localStorage.removeItem("googleCalendarAccessToken");
	window.localStorage.removeItem("googleCalendarExpirationTime");
};

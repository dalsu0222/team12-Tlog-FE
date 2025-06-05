declare global {
  interface GoogleTokenResponse {
    error?: string;
    access_token?: string;
    error_description?: string;
  }

  interface GoogleUserInfo {
    id: string;
    email: string;
    verified_email: boolean;
    name: string;
    given_name: string;
    family_name: string;
    picture: string;
    locale: string;
  }

  interface GoogleTokenClient {
    requestAccessToken: () => void;
  }

  interface GoogleOAuth2 {
    initTokenClient: (config: GoogleTokenClientConfig) => GoogleTokenClient;
  }

  interface GoogleTokenClientConfig {
    client_id: string;
    scope: string;
    callback: (response: GoogleTokenResponse) => void;
  }

  interface GoogleAccounts {
    oauth2?: GoogleOAuth2;
    id?: Record<string, unknown>;
  }

  interface Window {
    google?: {
      accounts?: GoogleAccounts;
    };
  }
}

export {};

import { SupportedProviders } from "../constants";

export interface ProviderAuth {
    public: string;
    private: string;
    model?: string;
}

export type KeyConfig = {
    [key in SupportedProviders]: ProviderAuth;
};

export type AuthConfig = EmbeddedAuthConfig | FetchedAuthConfig;

export interface EmbeddedAuthConfig {
    type: AuthType.EMBEDDED;
    keys: KeyConfig;
}

export interface FetchedAuthConfig {
    type: AuthType.FETCHED;
    url: string;
}

export enum AuthType {
    EMBEDDED = "embedded",
    FETCHED = "fetched",
}
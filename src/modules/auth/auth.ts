import { AuthConfig, AuthType, EmbeddedAuthConfig, Maybe } from "@/types";
import { CoreImpl } from "../core/core.impl";
import { AuthImpl } from "./auth.impl";

export class Auth implements AuthImpl {
    private authConfig: Maybe<AuthConfig> = null;

    authenticate(config: AuthConfig): CoreImpl {
        this.authConfig = config;
        throw new Error("Method not implemented.");
    }

    fetchKeysFromUrl(url: string): Promise<Maybe<EmbeddedAuthConfig>> {
        return new Promise((resolve, reject) => {
            fetch(url)
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(`Network response was not ok: ${response.statusText}`);
                    }
                    return response.json();
                })
                .then((data) => {
                    // Assuming the fetched data is in the correct format
                    resolve(data as EmbeddedAuthConfig);
                })
                .catch((error) => {
                    reject(`Failed to fetch keys from URL: ${error.message}`);
                });
        });
    }

    isAuthenticated(): boolean {
        // Placeholder implementation
        return false;
    }

    get usesEmbeddedKeys(): boolean {
        // Placeholder implementation
        return this.authConfig?.type === AuthType.EMBEDDED;
    }

    get usesFetchedKeys(): boolean {
        // Placeholder implementation
        return this.authConfig?.type === AuthType.FETCHED;
    }
    
}
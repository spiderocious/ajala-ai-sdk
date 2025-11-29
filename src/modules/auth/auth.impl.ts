import { AuthConfig } from "@/types";
import { CoreImpl } from "../core/core.impl";

export interface AuthImpl {
    authenticate(config: AuthConfig): CoreImpl;
    isAuthenticated(): boolean;
    readonly usesEmbeddedKeys: boolean;
    readonly usesFetchedKeys: boolean;
}
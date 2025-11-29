import { ALL_ERRORS, ERROR_CODES } from "@/constants";

export class AjalaError {
    throw(code: keyof typeof ERROR_CODES) {
        const error = ALL_ERRORS.find((err) => err.code === ERROR_CODES[code]);
        if (error) {
            const errInstance = new globalThis.Error(
                typeof error.message === "string" ? error.message : String(ERROR_CODES[code])
            );
            Object.assign(errInstance, error);
            throw errInstance;
        } else {
            throw new globalThis.Error("Unknown error code");
        }
    }
}

export const ajalaError = new AjalaError();
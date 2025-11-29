export interface CoreImpl { 
    prompt<T>(input: string): Promise<string>;
}
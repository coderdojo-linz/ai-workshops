export type Result<T, E extends TypedError> = OkResult<T> | ErrorResult<E>;

export type OkResult<T> = {
    readonly success: true;
    readonly value: T;
    readonly error?: never;
  };
  
export type ErrorResult<E extends TypedError> = {
    readonly success: false;
    readonly error: E;
    readonly value?: never;
};

export type TypedError = { readonly type: string };

// Constructors
export const ok = <T>(value: T): Result<T, never> => ({ success: true, value });
export const err = <E extends TypedError>(error: E): Result<never, E> => ({ success: false, error });

// Type guards
export const isOk = <T, E extends TypedError>(r: Result<T, E>): r is OkResult<T> => r.success;
export const isErr = <T, E extends TypedError>(r: Result<T, E>): r is ErrorResult<E> => !r.success;

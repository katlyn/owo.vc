// This is here because global fetch isn't documented in @types/node yet

declare global {
  export const {
    fetch,
    FormData,
    Headers,
    Request,
    Response
  }: typeof import("undici")
}

export {}

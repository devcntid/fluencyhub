declare module "midtrans-client" {
  export class Snap {
    constructor(opts: { isProduction: boolean; serverKey: string; clientKey: string });
    createTransaction(payload: Record<string, unknown>): Promise<{ token: string; redirect_url: string }>;
  }
  export class CoreApi {
    constructor(opts: { isProduction: boolean; serverKey: string; clientKey: string });
    charge(payload: Record<string, unknown>): Promise<unknown>;
  }
}

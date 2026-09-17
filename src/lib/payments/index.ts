// The single point where the active payment provider is chosen.
// Checkout routes and webhook handlers should import `paymentProvider`
// from here — never a specific provider file.
//
// To swap providers later: add a new file implementing PaymentProvider,
// add a case below, change PAYMENT_PROVIDER in the environment. Nothing
// else in the app should need to change.

import type { PaymentProvider } from "./types";
import { IntaSendProvider } from "./intasend";

function resolveProvider(): PaymentProvider {
  const providerName = process.env.PAYMENT_PROVIDER ?? "intasend";

  switch (providerName) {
    case "intasend":
      return new IntaSendProvider();
    default:
      throw new Error(`Unknown PAYMENT_PROVIDER: ${providerName}`);
  }
}

export const paymentProvider: PaymentProvider = resolveProvider();
export type { PaymentProvider } from "./types";

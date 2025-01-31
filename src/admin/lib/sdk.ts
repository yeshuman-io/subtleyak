import Medusa from "@medusajs/js-sdk"

export const sdk = new Medusa({
  baseUrl: "http://localhost:8000",
  debug: process.env.NODE_ENV === "development",
  auth: {
    type: "session",
  },
})
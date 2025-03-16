import type { 
  MedusaRequest, 
  MedusaResponse,
} from "@medusajs/framework/http"

export const GET = (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  res.json({
    message: "Admin route",
  })
}

// Disable CORS for admin routes
export const CORS = false 
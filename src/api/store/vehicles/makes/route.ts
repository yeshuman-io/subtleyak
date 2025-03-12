import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const queryOptions = {
    entity: "vehicle_make",
    ...req.queryConfig,
    fields: [
      "id",
      "name",
      "models.*",
    ],
  }

  try {
    const { data: vehicleMakes, metadata } = await query.graph(queryOptions)

    // Get pagination information from the request's query config
    const limit = req.queryConfig?.pagination?.take || 10
    const offset = req.queryConfig?.pagination?.skip || 0

    res.json({
      vehicleMakes,
      count: metadata?.count || 0,
      limit,
      offset,
    })
  } catch (error) {
    console.error("Error fetching Vehicle Makes:", error)
    res.status(500).json({ error: "An error occurred while fetching Vehicle Makes" })
  }
}
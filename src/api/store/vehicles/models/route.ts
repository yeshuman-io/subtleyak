import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  
  // Extract make_id from query parameters if present
  const makeId = req.query.make_id as string | undefined

  // Create query options
  const queryOptions: any = {
    entity: "vehicle_model",
    ...req.queryConfig,
    fields: [
      "id",
      "name",
      "make_id",
      "make.name",
    ],
  }

  // Add make filter if provided
  if (makeId) {
    // Use the actual foreign key field in the model
    queryOptions.filters = {
      make_id: [makeId]
    }
  }

  try {
    // Execute the query with proper filtering
    const { data: vehicleModels, metadata } = await query.graph(queryOptions)

    // Get pagination information from the request's query config
    const limit = req.queryConfig?.pagination?.take || 10
    const offset = req.queryConfig?.pagination?.skip || 0

    res.json({
      vehicleModels,
      count: metadata?.count || 0,
      limit,
      offset,
    })
  } catch (error) {
    console.error("Error fetching Vehicle Models:", error)
    res.status(500).json({ error: "An error occurred while fetching Vehicle Models" })
  }
}
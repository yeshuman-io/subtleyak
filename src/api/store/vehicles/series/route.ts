import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  // Extract filter parameters if present
  const modelId = req.query.model_id as string | undefined
  const vehicleId = req.query.vehicle_id as string | undefined

  // Create query options
  const queryOptions: any = {
    entity: "vehicle_series",
    ...req.queryConfig,
    fields: [
      "id",
      "start_year",
      "end_year",
      "model_id",
      "vehicle_id",
      "vehicle.name",
      "model.name",
    ],
  }

  // Add filters if provided
  const filters: Record<string, string[]> = {}
  
  if (modelId) {
    filters.model_id = [modelId]
  }
  
  if (vehicleId) {
    filters.vehicle_id = [vehicleId]
  }
  
  // Only add filters if we have any
  if (Object.keys(filters).length > 0) {
    queryOptions.filters = filters
  }

  try {
    // Execute the query with proper filtering
    const { data: vehicleSeries, metadata } = await query.graph(queryOptions)

    // Get pagination information from the request's query config
    const limit = req.queryConfig?.pagination?.take || 10
    const offset = req.queryConfig?.pagination?.skip || 0

    res.json({
      vehicleSeries,
      count: metadata?.count || 0,
      limit,
      offset,
    })
  } catch (error) {
    console.error("Error fetching Vehicle Series:", error)
    res.status(500).json({ error: "An error occurred while fetching Vehicle Series" })
  }
}
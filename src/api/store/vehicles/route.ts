import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  // Extract filter parameters if present
  const makeId = req.query.make_id as string | undefined
  const modelId = req.query.model_id as string | undefined
  const seriesId = req.query.series_id as string | undefined

  // Create query options
  const queryOptions: any = {
    entity: "vehicle",
    ...req.queryConfig,
    fields: [
      "id",
      "make_id",
      "model_id",
      "make.id",
      "make.name",
      "model.id",
      "model.name",
      "series.id",
      "series.name",
    ],
  }

  // Add filters if provided
  const filters: Record<string, string[]> = {}
  
  if (makeId) {
    filters.make_id = [makeId]
  }
  
  if (modelId) {
    filters.model_id = [modelId]
  }
  
  // Only add filters if we have any
  if (Object.keys(filters).length > 0) {
    queryOptions.filters = filters
  }

  try {
    // Execute the query with proper filtering
    const { data: vehicles, metadata } = await query.graph(queryOptions)

    // For hasMany relationships (series), we need to filter in memory
    // after we retrieve the data
    let filteredVehicles = vehicles;
    
    if (seriesId) {
      filteredVehicles = vehicles.filter(vehicle => 
        vehicle.series && vehicle.series.some(series => series.id === seriesId)
      );
    }

    // Get pagination information from the request's query config
    const limit = req.queryConfig?.pagination?.take || 10
    const offset = req.queryConfig?.pagination?.skip || 0

    res.json({
      vehicles: filteredVehicles,
      count: filteredVehicles.length,
      limit,
      offset,
    })
  } catch (error) {
    console.error("Error fetching Vehicles:", error)
    res.status(500).json({ error: "An error occurred while fetching Vehicles" })
  }
}
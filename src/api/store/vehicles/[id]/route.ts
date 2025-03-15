import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  // Extract vehicle ID from route parameter
  const vehicleId = req.params.id
  
  if (!vehicleId) {
    return res.status(400).json({ error: "Vehicle ID is required" })
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  // Create query options for a single vehicle
  const queryOptions: any = {
    entity: "vehicle",
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
      "series.start_year",
      "series.end_year",
    ],
    where: { id: vehicleId },
  }

  try {
    // Execute the query for a single vehicle
    const { data } = await query.graph(queryOptions)
    
    // Check if vehicle exists
    if (!data || data.length === 0) {
      return res.status(404).json({ error: "Vehicle not found" })
    }

    // Return the first (and only) vehicle
    res.json({
      vehicle: data[0],
    })
  } catch (error) {
    console.error(`Error fetching Vehicle with ID ${vehicleId}:`, error)
    res.status(500).json({ error: "An error occurred while fetching the Vehicle" })
  }
}

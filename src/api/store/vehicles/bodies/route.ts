import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  // Extract filter parameters if present
  const modelId = req.query.model_id as string | undefined

  // Create query options
  const queryOptions: any = {
    entity: "vehicle_body",
    ...req.queryConfig,
    fields: [
      "id",
      "name",
      "models.id",
      "models.name",
    ],
  }

  try {
    // Execute the query with proper filtering
    const { data: vehicleBodies, metadata } = await query.graph(queryOptions)

    // For many-to-many relationships, we need to filter in memory
    // after we retrieve the data
    let filteredBodies = vehicleBodies;
    
    if (modelId) {
      filteredBodies = vehicleBodies.filter(body => 
        body.models && body.models.some(model => model.id === modelId)
      );
    }

    // Get pagination information from the request's query config
    const limit = req.queryConfig?.pagination?.take || 10
    const offset = req.queryConfig?.pagination?.skip || 0

    res.json({
      vehicleBodies: filteredBodies,
      count: filteredBodies.length,
      limit,
      offset,
    })
  } catch (error) {
    console.error("Error fetching Vehicle Bodies:", error)
    res.status(500).json({ error: "An error occurred while fetching Vehicle Bodies" })
  }
}
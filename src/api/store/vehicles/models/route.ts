import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const queryOptions = {
    entity: "vehicle_model",
    ...req.queryConfig,
    filters: {
      ...req.queryConfig?.filters,
      // Add any additional filters specific to storefront
    },
    fields: [
      "id",
      "name",
      "make.name",
    ],
  }

  try {
    const { data: vehicleModels, metadata } = await query.graph(queryOptions)

    res.json({
      vehicleModels,
    })
  } catch (error) {
    console.error("Error fetching Vehicle Models:", error)
    res.status(500).json({ error: "An error occurred while fetching Vehicle Models" })
  }
}
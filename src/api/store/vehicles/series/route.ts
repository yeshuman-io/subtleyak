import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const queryOptions = {
    entity: "vehicle_series",
    ...req.queryConfig,
    filters: {
      ...req.queryConfig?.filters,
      // Add any additional filters specific to storefront
    },
    fields: [
      "id",
      "start_year",
      "end_year",
      "vehicle.name",
      "model.name",
    ],
  }

  try {
    const { data: vehicleSeries, metadata } = await query.graph(queryOptions)

    res.json({
      vehicleSeries,
    })
  } catch (error) {
    console.error("Error fetching Vehicle Series:", error)
    res.status(500).json({ error: "An error occurred while fetching Vehicle Series" })
  }
}
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const queryOptions = {
    entity: "vehicle",
    ...req.queryConfig,
    filters: {
      ...req.queryConfig?.filters,
      // Add any additional filters specific to storefront
    },
    fields: [
      "id",
      "name",
      // Add other fields you want to expose to the storefront
    ],
  }

  try {
    const { data: vehicles, metadata } = await query.graph(queryOptions)

    res.json({
      vehicles,
      count: metadata.count,
      limit: metadata.take,
      offset: metadata.skip,
    })
  } catch (error) {
    console.error("Error fetching Vehicles:", error)
    res.status(500).json({ error: "An error occurred while fetching Vehicles" })
  }
}
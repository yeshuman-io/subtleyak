import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const queryOptions = {
    entity: "wiper",
    ...req.queryConfig,
    filters: {
      ...req.queryConfig?.filters,
      // Add any additional filters specific to storefront
    },
    fields: [
      "id",
      "name",
      "code",
      "kits.*",
    ],
  }

  try {
    const { data: wipers, metadata } = await query.graph(queryOptions)

    res.json({
      wipers,
    })
  } catch (error) {
    console.error("Error fetching Wipers:", error)
    res.status(500).json({ error: "An error occurred while fetching Wipers" })
  }
}
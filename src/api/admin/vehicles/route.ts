import {
    MedusaRequest,
    MedusaResponse,
} from "@medusajs/framework/http"

import vehicles from "../../../modules/vehicles"
  
export const GET = async (
    req: MedusaRequest,
    res: MedusaResponse
) => {
    const query = req.scope.resolve("query")
    
    const { 
        data: vehicles, 
        metadata: { count, take, skip },
    } = await query.graph({
        entity: "vehicle",
        ...req.queryConfig,
    })
  
    res.json({ 
        vehicles,
        count,
        limit: take,
        offset: skip,
    })
}

/**
 * This file is auto-generated and will be overwritten by subsequent generations.
 * Manual changes should be made to the generator templates instead.
 */
import { 
  defineMiddlewares,
  validateAndTransformQuery,
  validateAndTransformBody 
} from "@medusajs/framework/http"
import { createFindParams } from "@medusajs/medusa/api/utils/validators"
import { z } from "zod"
import { 
  PostAdminCreateVehicleSeries,
  PostAdminUpdateVehicleSeries
} from "./validators"

export const GetVehicleSeriesSchema = createFindParams()
  .extend({
    vehicle_id: z.string().optional(),
    model_id: z.string().optional(),
  })

export default defineMiddlewares({
  routes: [
    // List Vehicle Seriess
    {
      matcher: "/admin/vehicles/series",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(GetVehicleSeriesSchema, {
          defaults: [
            "id",
            "start_year",
            "end_year",
            "vehicle.*",
                        "model.*"
                      ],
          isList: true
        })
      ]
    },

    // Update Vehicle Series
    {
      matcher: "/admin/vehicles/series/:id",	
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminUpdateVehicleSeries)
      ]
    },

    // Create Vehicle Series
    {
      matcher: "/admin/vehicles/series",	
          method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminCreateVehicleSeries)
      ]
    },

  ] as const
}) 



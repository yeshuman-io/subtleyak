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
  PostAdminCreateVehicleModel,
  PostAdminUpdateVehicleModel
} from "./validators"

export const GetVehicleModelSchema = createFindParams()
  .extend({
    make_id: z.string().optional(),
  })

export default defineMiddlewares({
  routes: [
    // List Vehicle Models
    {
      matcher: "/admin/vehicles/models",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(GetVehicleModelSchema, {
          defaults: [
            "id",
            "name",
            "make.*",
                      ],
          isList: true
        })
      ]
    },

    // Update Vehicle Model
    {
      matcher: "/admin/vehicles/models/:id",	
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminUpdateVehicleModel)
      ]
    },

    // Create Vehicle Model
    {
      matcher: "/admin/vehicles/models",	
          method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminCreateVehicleModel)
      ]
    },

  ] as const
}) 



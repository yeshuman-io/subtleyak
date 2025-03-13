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
  PostAdminCreateVehicleBody,
  PostAdminUpdateVehicleBody
} from "./validators"

export const GetVehicleBodySchema = createFindParams()

export default defineMiddlewares({
  routes: [
    // List Vehicle Bodys
    {
      matcher: "/admin/vehicles/bodies",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(GetVehicleBodySchema, {
          defaults: [
            "id",
            "name",
          ],
          isList: true
        })
      ]
    },

    // Update Vehicle Body
    {
      matcher: "/admin/vehicles/bodies/:id",	
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminUpdateVehicleBody)
      ]
    },

    // Create Vehicle Body
    {
      matcher: "/admin/vehicles/bodies",	
          method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminCreateVehicleBody)
      ]
    },

  ] as const
}) 



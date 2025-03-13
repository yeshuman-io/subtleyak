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
  PostAdminCreateVehicleMake,
  PostAdminUpdateVehicleMake
} from "./validators"

export const GetVehicleMakeSchema = createFindParams()

export default defineMiddlewares({
  routes: [
    // List Vehicle Makes
    {
      matcher: "/admin/vehicles/makes",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(GetVehicleMakeSchema, {
          defaults: [
            "id",
            "name",
          ],
          isList: true
        })
      ]
    },

    // Update Vehicle Make
    {
      matcher: "/admin/vehicles/makes/:id",	
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminUpdateVehicleMake)
      ]
    },

    // Create Vehicle Make
    {
      matcher: "/admin/vehicles/makes",	
          method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminCreateVehicleMake)
      ]
    },

  ] as const
}) 



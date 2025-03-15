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
  PostAdminCreateWiperLength,
  PostAdminUpdateWiperLength
} from "./validators"

export const GetWiperLengthSchema = createFindParams()

export default defineMiddlewares({
  routes: [
    // List Wiper Lengths
    {
      matcher: "/admin/wipers/lengths",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(GetWiperLengthSchema, {
          defaults: [
            "id",
            "value",
            "unit"
          ],
          isList: true
        })
      ]
    },

    // Update Wiper Length
    {
      matcher: "/admin/wipers/lengths/:id",	
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminUpdateWiperLength)
      ]
    },

    // Create Wiper Length
    {
      matcher: "/admin/wipers/lengths",	
          method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminCreateWiperLength)
      ]
    },

  ] as const
}) 



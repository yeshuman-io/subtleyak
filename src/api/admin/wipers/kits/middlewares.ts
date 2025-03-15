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
  PostAdminCreateWiperKit,
  PostAdminUpdateWiperKit
} from "./validators"

export const GetWiperKitSchema = createFindParams()
  .extend({
    wiper_id: z.string().optional(),
  })

export default defineMiddlewares({
  routes: [
    // List Wiper Kits
    {
      matcher: "/admin/wipers/kits",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(GetWiperKitSchema, {
          defaults: [
            "id",
            "name",
            "code",
            "wiper.*"
                      ],
          isList: true
        })
      ]
    },

    // Update Wiper Kit
    {
      matcher: "/admin/wipers/kits/:id",	
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminUpdateWiperKit)
      ]
    },

    // Create Wiper Kit
    {
      matcher: "/admin/wipers/kits",	
          method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminCreateWiperKit)
      ]
    },

  ] as const
}) 



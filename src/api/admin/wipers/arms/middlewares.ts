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
  PostAdminCreateWiperArm,
  PostAdminUpdateWiperArm
} from "./validators"

export const GetWiperArmSchema = createFindParams()
  .extend({
    connector_id: z.string().optional(),
  })

export default defineMiddlewares({
  routes: [
    // List Wiper Arms
    {
      matcher: "/admin/wipers/arms",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(GetWiperArmSchema, {
          defaults: [
            "id",
            "name",
            "code",
            "connector.*"
                      ],
          isList: true
        })
      ]
    },

    // Update Wiper Arm
    {
      matcher: "/admin/wipers/arms/:id",	
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminUpdateWiperArm)
      ]
    },

    // Create Wiper Arm
    {
      matcher: "/admin/wipers/arms",	
          method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminCreateWiperArm)
      ]
    },

  ] as const
}) 



/**
 * This file is auto-generated and will be overwritten by subsequent generations.
 * Manual changes should be made to the generator templates instead.
 */

import { 
  defineMiddlewares,
  unlessPath,
  validateAndTransformQuery,
  validateAndTransformBody 
} from "@medusajs/framework/http"
import { createFindParams } from "@medusajs/medusa/api/utils/validators"
import { z } from "zod"
import { 
  PostAdminCreateFitment,
  PostAdminUpdateFitment
} from "./validators"

export const GetTestsSchema = createFindParams()

export default defineMiddlewares({
  routes: [
    // List fitments
    {
      matcher: "/admin/fitments",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(GetTestsSchema, {
          defaults: [
            "id",
          ],
          isList: true
        })
      ]
    },

    // Update fitment
    {
      matcher: "/admin/fitments/:id",
      method: "POST",
      middlewares: [
        unlessPath(
          /.*\/(fitments)/,
          validateAndTransformBody(PostAdminUpdateFitment)
        ),
      ]
    },

    // Create fitment
    {
      matcher: "/admin/fitments",
      method: "POST",
      middlewares: [
        unlessPath(
          /.*\/(fitments)/,
          validateAndTransformBody(PostAdminCreateFitment)
        ),
      ]
    },

  ] as const
}) 



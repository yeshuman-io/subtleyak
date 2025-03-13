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
  PostAdminCreateWiper,
  PostAdminUpdateWiper
} from "./validators"

export const GetTestsSchema = createFindParams()

export default defineMiddlewares({
  routes: [
    // List wipers
    {
      matcher: "/admin/wipers",
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

    // Update wiper
    {
      matcher: "/admin/wipers/:id",
      method: "POST",
      middlewares: [
        unlessPath(
          /.*\/(wipers|kits|lengths|connectors|arms)/,
          validateAndTransformBody(PostAdminUpdateWiper)
        ),
      ]
    },

    // Create wiper
    {
      matcher: "/admin/wipers",
      method: "POST",
      middlewares: [
        unlessPath(
          /.*\/(wipers|kits|lengths|connectors|arms)/,
          validateAndTransformBody(PostAdminCreateWiper)
        ),
      ]
    },

  ] as const
}) 



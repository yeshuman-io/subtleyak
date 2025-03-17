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
  PostAdminCreateVehicle,
  PostAdminUpdateVehicle
} from "./validators"

export const GetTestsSchema = createFindParams()

export default defineMiddlewares({
  routes: [
    // List vehicles
    {
      matcher: "/admin/vehicles",
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

    // Update vehicle
    {
      matcher: "/admin/vehicles/:id",
      method: "POST",
      middlewares: [
        unlessPath(
          /.*\/(vehicles|series|makes|models|bodies)/,
          validateAndTransformBody(PostAdminUpdateVehicle)
        ),
      ]
    },

    // Create vehicle
    {
      matcher: "/admin/vehicles",
      method: "POST",
      middlewares: [
        unlessPath(
          /.*\/(vehicles|series|makes|models|bodies)/,
          validateAndTransformBody(PostAdminCreateVehicle)
        ),
      ]
    },

  ] as const
}) 



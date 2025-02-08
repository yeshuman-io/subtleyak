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
  PostAdminCreateWiperConnector,
  PostAdminUpdateWiperConnector
} from "./validators"

export const GetWiperConnectorSchema = createFindParams()

export default defineMiddlewares({
  routes: [
    // List Wiper Connectors
    {
      matcher: "/admin/wipers/connectors",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(GetWiperConnectorSchema, {
          defaults: [
            "id",
            "name",
            "code",
            "type",
            "media_url",
          ],
          isList: true
        })
      ]
    },

    // Update Wiper Connector
    {
      matcher: "/admin/wipers/connectors/:id",	
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminUpdateWiperConnector)
      ]
    },

    // Create Wiper Connector
    {
      matcher: "/admin/wipers/connectors",	
          method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminCreateWiperConnector)
      ]
    },

  ] as const
}) 



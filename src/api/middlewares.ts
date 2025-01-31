import { 
    defineMiddlewares,
    validateAndTransformQuery,
  } from "@medusajs/framework/http"
  import { createFindParams } from "@medusajs/medusa/api/utils/validators"
  // other imports...
  
  export const GetVehiclesSchema = createFindParams()
  
  export default defineMiddlewares({
    routes: [
      // ...
      {
        matcher: "/admin/vehicles",
        method: "GET",
        middlewares: [
          validateAndTransformQuery(
            GetVehiclesSchema,
            {
              defaults: [
                "id",
                "startYear",
                "endYear",
                "vehicle_make.*",
                // TODO: fetch vehicle_model
              ],
              isList: true,
            }
          ),
        ],
      },
  
    ],
  })
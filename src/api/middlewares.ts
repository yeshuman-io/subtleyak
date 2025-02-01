import {
  defineMiddlewares,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http";
import { createFindParams } from "@medusajs/medusa/api/utils/validators";
import { PostAdminCreateVehicleMake } from "./admin/vehicles/makes/validators";

export const GetVehiclesSchema = createFindParams();

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/vehicles",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(GetVehiclesSchema, {
          defaults: ["id", "startYear", "endYear", "make.*", "model.*"],
          isList: true,
        }),
      ],
    },
    {
      matcher: "/admin/vehicles/makes",
      method: "POST",
      middlewares: [validateAndTransformBody(PostAdminCreateVehicleMake)],
    },
  ],
});

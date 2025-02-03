import {
  defineMiddlewares,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http";
import { createFindParams } from "@medusajs/medusa/api/utils/validators";
import { PostAdminCreateVehicle } from "./admin/vehicles/validators";
import { PostAdminCreateVehicleMake } from "./admin/vehicles/makes/validators";
import {
  PostAdminCreateVehicleModel,
  PutAdminUpdateVehicleModel,
} from "./admin/vehicles/models/validators";

export const GetVehiclesSchema = createFindParams();

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/vehicles",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(GetVehiclesSchema, {
          defaults: ["id", "start_year", "end_year", "make.*", "model.*"],
          isList: true,
        }),
      ],
    },
    {
      matcher: "/admin/vehicles/makes",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(GetVehiclesSchema, {
          defaults: ["id", "name", "models.*"],
          isList: true,
        }),
      ],
    },
    {
      matcher: "/admin/vehicles/models",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(GetVehiclesSchema, {
          defaults: ["id", "name", "make.*"],
          isList: true,
        }),
      ],
    },
    // POST
    {
      matcher: "/admin/vehicles",
      method: "POST",
      middlewares: [validateAndTransformBody(PostAdminCreateVehicle)],
    },
    {
      matcher: "/admin/vehicles/makes",
      method: "POST",
      middlewares: [validateAndTransformBody(PostAdminCreateVehicleMake)],
    },
    {
      matcher: "/admin/vehicles/models",
      method: "POST",
      middlewares: [validateAndTransformBody(PostAdminCreateVehicleModel)],
    },
    // PUT
    {
      matcher: "/admin/vehicles/models/:id",
      method: "PUT",
      middlewares: [validateAndTransformBody(PutAdminUpdateVehicleModel)],
    }//,
    // {
    //   matcher: "/admin/vehicles/makes/:id",
    //   method: "PUT",
    //   middlewares: [validateAndTransformBody(PutAdminUpdateVehicleMake)],
    // },
  ],
});

import { z } from "zod";
import {
  defineMiddlewares,
  unlessPath,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http";
import { createFindParams } from "@medusajs/medusa/api/utils/validators";
import {
  PostAdminCreateVehicle,
  PostAdminUpdateVehicle,
} from "./admin/vehicles/validators";
import {
  PostAdminCreateVehicleMake,
  PostAdminUpdateVehicleMake,
} from "./admin/vehicles/makes/validators";
import {
  PostAdminCreateVehicleModel,
  PostAdminUpdateVehicleModel,
} from "./admin/vehicles/models/validators";
import {
  PostAdminCreateVehicleBody,
  PostAdminUpdateVehicleBody,
} from "./admin/vehicles/bodies/validators";

export const GetVehiclesSchema = createFindParams();
export const GetVehicleModelsSchema = createFindParams().extend({
  make_id: z.string().optional(),
});

export default defineMiddlewares({
  routes: [
    // GET routes - specific first
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
        validateAndTransformQuery(GetVehicleModelsSchema, {
          defaults: ["id", "name", "make.*"],
          isList: true,
        }),
      ],
    },
    {
      matcher: "/admin/vehicles/bodies",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(GetVehiclesSchema, {
          defaults: ["id", "name"],
          isList: true,
        }),
      ],
    },
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

    // CREATE - specific routes first
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
    {
      matcher: "/admin/vehicles/bodies",
      method: "POST",
      middlewares: [validateAndTransformBody(PostAdminCreateVehicleBody)],
    },

    // UPDATE - specific routes first
    {
      matcher: "/admin/vehicles/makes/:id",
      method: "POST",
      middlewares: [validateAndTransformBody(PostAdminUpdateVehicleMake)],
    },
    {
      matcher: "/admin/vehicles/models/:id",
      method: "POST",
      middlewares: [validateAndTransformBody(PostAdminUpdateVehicleModel)],
    },
    {
      matcher: "/admin/vehicles/bodies/:id",
      method: "POST",
      middlewares: [validateAndTransformBody(PostAdminUpdateVehicleBody)],
    },

    // Generic routes last
    {
      matcher: "/admin/vehicles",
      method: "POST",
      middlewares: [
        unlessPath(
          /.*\/(models|makes|bodies)/,
          validateAndTransformBody(PostAdminCreateVehicle)
        ),
      ],
    },
    {
      matcher: "/admin/vehicles/:id",
      method: "POST",
      middlewares: [
        unlessPath(
          /.*\/(models|makes|bodies)/,
          validateAndTransformBody(PostAdminUpdateVehicle)
        ),
      ],
    },
  ],
});

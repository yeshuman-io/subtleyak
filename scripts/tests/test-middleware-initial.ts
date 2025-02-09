/*This file is auto-generated and will be overwritten by subsequent generations
Manual changes should be made to the generator templates instead*/ import {
  PostAdminCreateVehicleBody,
  PostAdminUpdateVehicleBody,
} from './admin/vehicles/bodies/validators';
import {
  PostAdminCreateVehicleMake,
  PostAdminUpdateVehicleMake,
} from './admin/vehicles/makes/validators';
import {
  PostAdminCreateVehicleModel,
  PostAdminUpdateVehicleModel,
} from './admin/vehicles/models/validators';
import {
  PostAdminCreateVehicle,
  PostAdminUpdateVehicle,
} from './admin/vehicles/validators';
import {
  defineMiddlewares,
  unlessPath,
  validateAndTransformBody,
  validateAndTransformQuery,
} from '@medusajs/framework/http';
import { createFindParams } from '@medusajs/medusa/api/utils/validators';
import { z } from 'zod';
export default defineMiddlewares({
  routes: [
    {
      matcher: '/admin/vehicles/bodies',
      method: 'GET',
      middlewares: [
        validateAndTransformQuery(GetVehiclesSchema, {
          defaults: ['id', 'name'],
          isList: true,
        }),
      ],
    }, // GET routes - specific first
    {
      matcher: '/admin/vehicles/makes',
      method: 'GET',
      middlewares: [
        validateAndTransformQuery(GetVehiclesSchema, {
          defaults: ['id', 'name', 'models.*'],
          isList: true,
        }),
      ],
    },
    {
      matcher: '/admin/vehicles/models',
      method: 'GET',
      middlewares: [
        validateAndTransformQuery(GetVehicleModelsSchema, {
          defaults: ['id', 'name', 'make.*'],
          isList: true,
        }),
      ],
    },
    {
      matcher: '/admin/vehicles',
      method: 'GET',
      middlewares: [
        validateAndTransformQuery(GetVehiclesSchema, {
          defaults: ['id', 'start_year', 'end_year', 'make.*', 'model.*'],
          isList: true,
        }),
      ],
    },

    {
      matcher: '/admin/vehicles/bodies/:id',
      method: 'POST',
      middlewares: [validateAndTransformBody(PostAdminUpdateVehicleBody)],
    }, // UPDATE - specific routes first
    {
      matcher: '/admin/vehicles/makes/:id',
      method: 'POST',
      middlewares: [validateAndTransformBody(PostAdminUpdateVehicleMake)],
    },
    {
      matcher: '/admin/vehicles/models/:id',
      method: 'POST',
      middlewares: [validateAndTransformBody(PostAdminUpdateVehicleModel)],
    },

    {
      matcher: '/admin/vehicles/:id',
      method: 'POST',
      middlewares: [
        unlessPath(
          /.*\/(models|makes|bodies)/,
          validateAndTransformBody(PostAdminUpdateVehicle)
        ),
      ],
    },
    {
      matcher: '/admin/vehicles/bodies',
      method: 'POST',
      middlewares: [validateAndTransformBody(PostAdminCreateVehicleBody)],
    }, // CREATE - specific routes first
    {
      matcher: '/admin/vehicles/makes',
      method: 'POST',
      middlewares: [validateAndTransformBody(PostAdminCreateVehicleMake)],
    },
    {
      matcher: '/admin/vehicles/models',
      method: 'POST',
      middlewares: [validateAndTransformBody(PostAdminCreateVehicleModel)],
    }, // Generic routes last
    {
      matcher: '/admin/vehicles',
      method: 'POST',
      middlewares: [
        unlessPath(
          /.*\/(models|makes|bodies)/,
          validateAndTransformBody(PostAdminCreateVehicle)
        ),
      ],
    },
  ],
});

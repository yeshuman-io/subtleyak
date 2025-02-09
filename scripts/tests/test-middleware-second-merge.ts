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
  PostAdminCreateVehicleSeries,
  PostAdminUpdateVehicleSeries,
} from './admin/vehicles/series/validators';
import {
  PostAdminCreateVehicle,
  PostAdminUpdateVehicle,
} from './admin/vehicles/validators';
import {
  PostAdminCreateWiperKit,
  PostAdminUpdateWiperKit,
} from './admin/wipers/kits/validators';
import {
  PostAdminCreateWiper,
  PostAdminUpdateWiper,
} from './admin/wipers/validators';
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
      matcher: '/admin/vehicles/models',
      method: 'GET',
      middlewares: [
        {
          name: 'validateAndTransformQuery',
          args: [
            'GetVehicleModelsSchema',
            {
              defaults: ['id', 'name', 'make_id'],
              relations: ['make'],
              isList: true,
            },
          ],
        },
      ],
    },

    {
      matcher: '/admin/vehicles/series',
      method: 'GET',
      middlewares: [
        {
          name: 'validateAndTransformQuery',
          args: [
            'GetVehicleSeriesSchema',
            { defaults: ['id', 'name', 'code'], relations: [], isList: true },
          ],
        },
      ],
    },

    // GET routes - specific first
    {
      matcher: '/admin/wipers/kits',
      method: 'GET',
      middlewares: [
        validateAndTransformQuery(GetWiperKitSchema, {
          defaults: ['id', 'name', 'code', 'wiper'],
          select: ['id', 'name', 'code', 'wiper'],
          relations: ['wiper'],
          isList: true,
        }),
      ],
    },
    {
      matcher: '/admin/wipers',
      method: 'GET',
      middlewares: [
        validateAndTransformQuery(GetWiperSchema, {
          defaults: ['id', 'name', 'code', 'kits'],
          select: ['id', 'name', 'code', 'kits'],
          relations: ['kits'],
          isList: true,
        }),
      ],
    },
    {
      matcher: '/admin/vehicles/models/:id',
      method: 'POST',
      middlewares: [
        {
          name: 'validateAndTransformBody',
          args: ['PostAdminUpdateVehicleModel'],
        },
      ],
    },
    {
      matcher: '/admin/vehicles/series/:id',
      method: 'POST',
      middlewares: [
        {
          name: 'validateAndTransformBody',
          args: ['PostAdminUpdateVehicleSeries'],
        },
      ],
    },

    // UPDATE routes - specific first
    {
      matcher: '/admin/wipers/kits/:id',
      method: 'POST',
      middlewares: [validateAndTransformBody(PostAdminUpdateWiperKit)],
    },
    {
      matcher: '/admin/wipers/:id',
      method: 'POST',
      middlewares: [validateAndTransformBody(PostAdminUpdateWiper)],
    },
    {
      matcher: '/admin/vehicles/models',
      method: 'POST',
      middlewares: [
        {
          name: 'validateAndTransformBody',
          args: ['PostAdminCreateVehicleModel'],
        },
      ],
    },
    {
      matcher: '/admin/vehicles/series',
      method: 'POST',
      middlewares: [
        {
          name: 'validateAndTransformBody',
          args: ['PostAdminCreateVehicleSeries'],
        },
      ],
    }, // CREATE routes - specific first
    {
      matcher: '/admin/wipers/kits',
      method: 'POST',
      middlewares: [validateAndTransformBody(PostAdminCreateWiperKit)],
    },
    {
      matcher: '/admin/wipers',
      method: 'POST',
      middlewares: [validateAndTransformBody(PostAdminCreateWiper)],
    },
  ],
});

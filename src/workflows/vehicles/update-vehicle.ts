import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { VEHICLES_MODULE } from "../../modules/vehicles";
import VehiclesModuleService from "../../modules/vehicles/service";

export type UpdateVehicleStepInput = {
  id: string;
  make_ids?: string[];
  model_ids?: string[];
  series_ids?: string[];
};

export const updateVehicleStep = createStep(
  "update-vehicle-step",
  async (input: UpdateVehicleStepInput, { container }) => {
    const vehiclesModuleService: VehiclesModuleService = 
      container.resolve(VEHICLES_MODULE);

    const vehicle = await vehiclesModuleService.updateVehicles(input);

    return new StepResponse(vehicle, vehicle.id);
  },
  async (id: string, { container }) => {
    const vehiclesModuleService: VehiclesModuleService = 
      container.resolve(VEHICLES_MODULE);

      // TODO: Rollback logic
  }
);

type UpdateVehicleWorkflowInput = {
  id: string;
  make_ids?: string[];
  model_ids?: string[];
  series_ids?: string[];
};

export const updateVehicleWorkflow = createWorkflow(
  "update-vehicle-workflow",
  (input: UpdateVehicleWorkflowInput) => {
    const vehicle = updateVehicleStep(input);

    return new WorkflowResponse(vehicle);
  }
);
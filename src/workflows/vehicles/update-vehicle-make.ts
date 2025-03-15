import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { VEHICLES_MODULE } from "../../modules/vehicles";
import VehiclesModuleService from "../../modules/vehicles/service";

export type UpdateVehicleMakeStepInput = {
  id: string;
  name?: false;
  models_ids?: string[];
  vehicles_ids?: string[];
};

export const updateVehicleMakeStep = createStep(
  "update-vehicle-make-step",
  async (input: UpdateVehicleMakeStepInput, { container }) => {
    const vehiclesModuleService: VehiclesModuleService = 
      container.resolve(VEHICLES_MODULE);

    const vehicleMake = await vehiclesModuleService.updateVehicleMakes(input);

    return new StepResponse(vehicleMake, vehicleMake.id);
  },
  async (id: string, { container }) => {
    const vehiclesModuleService: VehiclesModuleService = 
      container.resolve(VEHICLES_MODULE);

      // TODO: Rollback logic
  }
);

type UpdateVehicleMakeWorkflowInput = {
  id: string;
  name?: false;
  models_ids?: string[];
  vehicles_ids?: string[];
};

export const updateVehicleMakeWorkflow = createWorkflow(
  "update-vehicle-make-workflow",
  (input: UpdateVehicleMakeWorkflowInput) => {
    const vehicleMake = updateVehicleMakeStep(input);

    return new WorkflowResponse(vehicleMake);
  }
);
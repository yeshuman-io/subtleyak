import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { VEHICLES_MODULE } from "../../modules/vehicles";
import VehiclesModuleService from "../../modules/vehicles/service";

export type UpdateVehicleBodyStepInput = {
  id: string;
  name?: false;
  models_ids?: string[];
};

export const updateVehicleBodyStep = createStep(
  "update-vehicle-body-step",
  async (input: UpdateVehicleBodyStepInput, { container }) => {
    const vehiclesModuleService: VehiclesModuleService = 
      container.resolve(VEHICLES_MODULE);

    const vehicleBody = await vehiclesModuleService.updateVehicleBodys(input);

    return new StepResponse(vehicleBody, vehicleBody.id);
  },
  async (id: string, { container }) => {
    const vehiclesModuleService: VehiclesModuleService = 
      container.resolve(VEHICLES_MODULE);

      // TODO: Rollback logic
  }
);

type UpdateVehicleBodyWorkflowInput = {
  id: string;
  name?: false;
  models_ids?: string[];
};

export const updateVehicleBodyWorkflow = createWorkflow(
  "update-vehicle-body-workflow",
  (input: UpdateVehicleBodyWorkflowInput) => {
    const vehicleBody = updateVehicleBodyStep(input);

    return new WorkflowResponse(vehicleBody);
  }
);
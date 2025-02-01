import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { VEHICLES_MODULE } from "../modules/vehicles";
import VehiclesModuleService from "../modules/vehicles/service";

export type CreateVehicleStepInput = {
  name: string;
  makeId: string;
  modelId: string;
};

export const createVehicleStep = createStep(
  "create-vehicle-step",
  async (input: CreateVehicleStepInput, { container }) => {
    const vehiclesModuleService: VehiclesModuleService =
      container.resolve(VEHICLES_MODULE);

    const vehicle = await vehiclesModuleService.createVehicles(input);

    return new StepResponse(vehicle, vehicle.id);
  },
  async (id: string, { container }) => {
    const vehiclesModuleService: VehiclesModuleService =
      container.resolve(VEHICLES_MODULE);

    await vehiclesModuleService.deleteVehicles(id);
  }
);

type CreateVehicleWorkflowInput = {
  name: string;
  makeId: string;
  modelId: string;
};

export const createVehicleWorkflow = createWorkflow(
  "create-vehicle-workflow",
  (input: CreateVehicleWorkflowInput) => {
    const vehicle = createVehicleStep(input);

    return new WorkflowResponse(vehicle);
  }
);

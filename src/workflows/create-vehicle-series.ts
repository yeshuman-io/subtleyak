import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { VEHICLES_MODULE } from "../modules/vehicles";
import VehiclesModuleService from "../modules/vehicles/service";

export type CreateVehicleSeriesStepInput = {
  start_year: number;
  end_year: number;
  vehicle_id?: string;
  model_id?: string;
};

export const createVehicleSeriesStep = createStep(
  "create-vehicle-series-step",
  async (input: CreateVehicleSeriesStepInput, { container }) => {
    const vehiclesModuleService: VehiclesModuleService =
      container.resolve(VEHICLES_MODULE);

    const result = await vehiclesModuleService.createVehicleSeries({
      ...input,
    });

    return new StepResponse(result, result.id);
  },
  async (id: string, { container }) => {
    const vehiclesModuleService: VehiclesModuleService =
      container.resolve(VEHICLES_MODULE);

    await vehiclesModuleService.deleteVehicleSeries(id);
  },
);

type CreateVehicleSeriesWorkflowInput = CreateVehicleSeriesStepInput;

export const createVehicleSeriesWorkflow = createWorkflow(
  "create-vehicle-series-workflow",
  (input: CreateVehicleSeriesWorkflowInput) => {
    const result = createVehicleSeriesStep(input);
    return new WorkflowResponse(result);
  },
);

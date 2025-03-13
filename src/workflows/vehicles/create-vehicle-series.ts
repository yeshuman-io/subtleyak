import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { VEHICLES_MODULE } from "../../modules/vehicles";
import VehiclesModuleService from "../../modules/vehicles/service";

export type CreateVehicleSeriesStepInput = {
  start_year?: false;
  end_year?: false;
  vehicle_ids?: string[];
  model_ids?: string[];
};

export const createVehicleSeriesStep = createStep(
  "create-vehicle-series-step",
  async (input: CreateVehicleSeriesStepInput, { container }) => {
    const vehiclesModuleService: VehiclesModuleService = 
      container.resolve(VEHICLES_MODULE);

    const vehicleSeries = await vehiclesModuleService.createVehicleSeriess(input);

    return new StepResponse(vehicleSeries, vehicleSeries.id);
  },
  async (id: string, { container }) => {
    const vehiclesModuleService: VehiclesModuleService = 
      container.resolve(VEHICLES_MODULE);

    await vehiclesModuleService.deleteVehicleSeriess(id);
  }
);

type CreateVehicleSeriesWorkflowInput = CreateVehicleSeriesStepInput;

export const createVehicleSeriesWorkflow = createWorkflow(
  "create-vehicle-series-workflow",
  (input: CreateVehicleSeriesWorkflowInput) => {
    const vehicleSeries = createVehicleSeriesStep(input);

    return new WorkflowResponse(vehicleSeries);
  }
); 
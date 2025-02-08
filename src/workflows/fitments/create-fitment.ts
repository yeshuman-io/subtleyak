import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { FITMENTS_MODULE } from "../../modules/fitments";
import FitmentsModuleService from "../../modules/fitments/service";

export type CreateFitmentStepInput = {
  code?: false;
};

export const createFitmentStep = createStep(
  "create-fitment-step",
  async (input: CreateFitmentStepInput, { container }) => {
    const fitmentsModuleService: FitmentsModuleService = 
      container.resolve(FITMENTS_MODULE);

    const fitment = await fitmentsModuleService.createFitments(input);

    return new StepResponse(fitment, fitment.id);
  },
  async (id: string, { container }) => {
    const fitmentsModuleService: FitmentsModuleService = 
      container.resolve(FITMENTS_MODULE);

    await fitmentsModuleService.deleteFitments(id);
  }
);

type CreateFitmentWorkflowInput = CreateFitmentStepInput;

export const createFitmentWorkflow = createWorkflow(
  "create-fitment-workflow",
  (input: CreateFitmentWorkflowInput) => {
    const fitment = createFitmentStep(input);

    return new WorkflowResponse(fitment);
  }
); 